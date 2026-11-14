import crypto from 'crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type {
  ActivityLogItem,
  AnnouncementItem,
  Club,
  ClubAdminAssignment,
  EventItem,
  Profile,
} from '../types/index.ts';

export interface PortalSnapshotPayload {
  lastUpdatedAt?: string;
  clubs: Club[];
  events: EventItem[];
  announcements: AnnouncementItem[];
  clubAdmins: ClubAdminAssignment[];
  activityLogs: ActivityLogItem[];
  profiles: Profile[];
  authCredentials?: Record<string, { passwordHash: string; updatedAt: string }>;
  followedClubsByUser?: Record<string, string[]>;
  bookmarkedEventsByUser?: Record<string, string[]>;
  readNotificationsByUser?: Record<string, string[]>;
}

export interface VerifiedJwtClaims {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
  iss?: string;
  user_metadata?: Record<string, unknown>;
}

interface JwkKey {
  kid?: string;
  kty: string;
  alg?: string;
  crv?: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
  use?: string;
}

const SNAPSHOT_BUCKET = 'portal-state';
const SNAPSHOT_OBJECT_PATH = 'db-snapshot.json';

function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';
  const jwksUrl =
    process.env.SUPABASE_JWKS_URL ||
    (url ? `${url.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json` : '');
  return { url, publishableKey, secretKey, jwksUrl };
}

class SupabaseServerService {
  private adminClient: SupabaseClient | null = null;
  private publicClient: SupabaseClient | null = null;
  private jwksCache: { keys: JwkKey[]; fetchedAt: number } | null = null;
  private bucketReady: boolean = false;
  private postgresTablesReady: boolean | null = null;
  private uploadInFlight: Promise<void> | null = null;
  private pendingSnapshot: PortalSnapshotPayload | null = null;

  public isConfigured(): boolean {
    const { url, secretKey, publishableKey } = getConfig();
    return Boolean(url && secretKey && publishableKey);
  }

  public getAdminClient(): SupabaseClient | null {
    const { url, secretKey } = getConfig();
    if (!url || !secretKey) return null;
    if (!this.adminClient) {
      this.adminClient = createClient(url, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return this.adminClient;
  }

  public getPublicClient(): SupabaseClient | null {
    const { url, publishableKey } = getConfig();
    if (!url || !publishableKey) return null;
    if (!this.publicClient) {
      this.publicClient = createClient(url, publishableKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return this.publicClient;
  }

  private async fetchJwks(forceRefresh = false): Promise<JwkKey[]> {
    const { jwksUrl } = getConfig();
    if (!jwksUrl) return [];

    const now = Date.now();
    if (!forceRefresh && this.jwksCache && now - this.jwksCache.fetchedAt < 60 * 60 * 1000) {
      return this.jwksCache.keys;
    }

    const res = await fetch(jwksUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch JWKS (${res.status})`);
    }
    const body = (await res.json()) as { keys?: JwkKey[] };
    const keys = Array.isArray(body?.keys) ? body.keys : [];
    this.jwksCache = { keys, fetchedAt: now };
    return keys;
  }

  public async verifyJwt(token: string): Promise<VerifiedJwtClaims | null> {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8')) as {
        alg?: string;
        kid?: string;
      };
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      ) as VerifiedJwtClaims;

      const { url } = getConfig();
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }
      if (url && payload.iss && !payload.iss.startsWith(url.replace(/\/$/, ''))) {
        return null;
      }

      let keys = await this.fetchJwks(false);
      let jwk = keys.find((k) => !header.kid || k.kid === header.kid);
      if (!jwk) {
        keys = await this.fetchJwks(true);
        jwk = keys.find((k) => !header.kid || k.kid === header.kid);
      }
      if (!jwk) return null;

      const publicKey = crypto.createPublicKey({
        key: jwk as unknown as crypto.JsonWebKey,
        format: 'jwk',
      });
      const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf-8');
      const signature = Buffer.from(parts[2], 'base64url');

      const alg = header.alg || jwk.alg || 'ES256';
      let isValid = false;
      if (alg === 'ES256') {
        isValid = crypto.verify(
          'sha256',
          signingInput,
          { key: publicKey, dsaEncoding: 'ieee-p1363' },
          signature
        );
      } else if (alg === 'RS256') {
        isValid = crypto.verify('sha256', signingInput, publicKey, signature);
      }

      return isValid ? payload : null;
    } catch {
      return null;
    }
  }

  public async listAllAuthUsers(): Promise<User[]> {
    const admin = this.getAdminClient();
    if (!admin) return [];

    const allUsers: User[] = [];
    let page = 1;
    const perPage = 200;

    try {
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error || !data?.users?.length) break;
        allUsers.push(...data.users);
        if (data.users.length < perPage) break;
        page += 1;
      }
    } catch (err) {
      console.warn('Supabase listUsers failed:', err);
    }

    return allUsers;
  }

  public async findAuthUserByEmail(email: string): Promise<User | null> {
    const clean = email.trim().toLowerCase();
    const users = await this.listAllAuthUsers();
    return users.find((u) => u.email?.toLowerCase() === clean) || null;
  }

  public async confirmExistingIITDHUsers(
    isIITDHEmail: (email: string) => boolean
  ): Promise<User[]> {
    const admin = this.getAdminClient();
    const users = await this.listAllAuthUsers();
    if (!admin) return users;

    for (const user of users) {
      if (user.email && isIITDHEmail(user.email) && !user.email_confirmed_at) {
        try {
          await admin.auth.admin.updateUserById(user.id, {
            email_confirm: true,
          });
        } catch {}
      }
    }
    return users;
  }

  public async createConfirmedUser(params: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ user: User | null; alreadyExists: boolean; error?: string }> {
    const admin = this.getAdminClient();
    if (!admin) {
      return { user: null, alreadyExists: false };
    }

    const cleanEmail = params.email.trim().toLowerCase();
    const existing = await this.findAuthUserByEmail(cleanEmail);
    if (existing) {
      return { user: existing, alreadyExists: true };
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: params.password,
      email_confirm: true,
      user_metadata: { full_name: params.fullName.trim() },
    });

    if (error) {
      const msg = error.message || 'Failed to create Supabase user.';
      const alreadyExists = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists');
      return { user: null, alreadyExists, error: msg };
    }

    return { user: data.user, alreadyExists: false };
  }

  public async verifyPasswordLogin(
    email: string,
    password: string
  ): Promise<{ user: User | null; accessToken?: string; error?: string }> {
    const pub = this.getPublicClient();
    if (!pub) return { user: null };

    const { data, error } = await pub.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data?.user) {
      return { user: null, error: error?.message };
    }

    return {
      user: data.user,
      accessToken: data.session?.access_token,
    };
  }

  public async updateOrCreatePassword(
    email: string,
    newPassword: string,
    fullName?: string
  ): Promise<{ user: User | null; error?: string }> {
    const admin = this.getAdminClient();
    if (!admin) return { user: null };

    const cleanEmail = email.trim().toLowerCase();
    const existing = await this.findAuthUserByEmail(cleanEmail);
    if (existing) {
      const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
        password: newPassword,
        email_confirm: true,
      });
      if (error) return { user: null, error: error.message };
      return { user: data.user };
    }

    const created = await this.createConfirmedUser({
      email: cleanEmail,
      password: newPassword,
      fullName: fullName?.trim() || cleanEmail.split('@')[0],
    });
    return { user: created.user, error: created.error };
  }

  private async ensureSnapshotBucket(): Promise<boolean> {
    if (this.bucketReady) return true;
    const admin = this.getAdminClient();
    if (!admin) return false;

    try {
      const { data: buckets, error } = await admin.storage.listBuckets();
      if (error) return false;
      const exists = (buckets || []).some((b) => b.name === SNAPSHOT_BUCKET);
      if (!exists) {
        const { error: createErr } = await admin.storage.createBucket(SNAPSHOT_BUCKET, {
          public: false,
        });
        if (createErr && !createErr.message.toLowerCase().includes('already')) {
          return false;
        }
      }
      this.bucketReady = true;
      return true;
    } catch {
      return false;
    }
  }

  public async downloadPortalSnapshot(): Promise<PortalSnapshotPayload | null> {
    const admin = this.getAdminClient();
    if (!admin) return null;
    if (!(await this.ensureSnapshotBucket())) return null;

    try {
      const { data, error } = await admin.storage
        .from(SNAPSHOT_BUCKET)
        .download(SNAPSHOT_OBJECT_PATH);
      if (error || !data) return null;
      const text = await data.text();
      return JSON.parse(text) as PortalSnapshotPayload;
    } catch {
      return null;
    }
  }

  public queuePortalSnapshotUpload(snapshot: PortalSnapshotPayload): void {
    if (!this.isConfigured()) return;
    this.pendingSnapshot = JSON.parse(JSON.stringify(snapshot)) as PortalSnapshotPayload;
    if (!this.uploadInFlight) {
      this.uploadInFlight = this.flushSnapshotUploads();
    }
  }

  private async flushSnapshotUploads(): Promise<void> {
    try {
      while (this.pendingSnapshot) {
        const next = this.pendingSnapshot;
        this.pendingSnapshot = null;
        await this.uploadPortalSnapshotNow(next);
      }
    } finally {
      this.uploadInFlight = null;
    }
  }

  public async uploadPortalSnapshotNow(snapshot: PortalSnapshotPayload): Promise<boolean> {
    const admin = this.getAdminClient();
    if (!admin) return false;
    if (!(await this.ensureSnapshotBucket())) return false;

    try {
      const buffer = Buffer.from(JSON.stringify(snapshot), 'utf-8');
      const { error } = await admin.storage
        .from(SNAPSHOT_BUCKET)
        .upload(SNAPSHOT_OBJECT_PATH, buffer, {
          contentType: 'application/json',
          upsert: true,
        });
      return !error;
    } catch {
      return false;
    }
  }

  public async checkPostgresTablesReady(): Promise<boolean> {
    if (this.postgresTablesReady !== null) return this.postgresTablesReady;
    const admin = this.getAdminClient();
    if (!admin) {
      this.postgresTablesReady = false;
      return false;
    }

    try {
      const { error } = await admin.from('clubs').select('id').limit(1);
      this.postgresTablesReady = !error;
      return this.postgresTablesReady;
    } catch {
      this.postgresTablesReady = false;
      return false;
    }
  }

  public async mirrorTableUpsert(
    table: 'clubs' | 'events' | 'announcements',
    row: Record<string, unknown>
  ): Promise<void> {
    if (!(await this.checkPostgresTablesReady())) return;
    const admin = this.getAdminClient();
    if (!admin) return;
    try {
      await admin.from(table).upsert(row, { onConflict: 'id' });
    } catch {}
  }

  public async mirrorTableDelete(
    table: 'clubs' | 'events' | 'announcements',
    id: string
  ): Promise<void> {
    if (!(await this.checkPostgresTablesReady())) return;
    const admin = this.getAdminClient();
    if (!admin) return;
    try {
      await admin.from(table).delete().eq('id', id);
    } catch {}
  }
}

export const supabaseService = new SupabaseServerService();
