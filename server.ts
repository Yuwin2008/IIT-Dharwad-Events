import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { supabaseService } from './src/server/supabaseService.ts';
import {
  SUPER_ADMIN_EMAIL,
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLUB_ADMINS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PROFILES,
} from './src/lib/seedData.ts';
import { validateAndSanitizeEventDates } from './src/lib/dateValidation.ts';
import type {
  Club,
  EventItem,
  AnnouncementItem,
  ClubAdminAssignment,
  ActivityLogItem,
  Profile,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'portal-db.json');

interface AuthCredential {
  passwordHash: string;
  updatedAt: string;
}

interface PortalDatabase {
  lastUpdatedAt?: string;
  clubs: Club[];
  events: EventItem[];
  announcements: AnnouncementItem[];
  clubAdmins: ClubAdminAssignment[];
  activityLogs: ActivityLogItem[];
  profiles: Profile[];
  authCredentials?: Record<string, AuthCredential>;
  followedClubsByUser?: Record<string, string[]>;
  bookmarkedEventsByUser?: Record<string, string[]>;
  readNotificationsByUser?: Record<string, string[]>;
}

function loadDatabase(): PortalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let db: PortalDatabase | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw) as PortalDatabase;
    } catch (err) {
      console.error('Failed to parse existing portal-db.json, reinitializing:', err);
    }
  }

  if (!db) {
    db = {
      clubs: [...INITIAL_CLUBS],
      events: [...INITIAL_EVENTS],
      announcements: [...INITIAL_ANNOUNCEMENTS],
      clubAdmins: [...INITIAL_CLUB_ADMINS],
      activityLogs: [...INITIAL_ACTIVITY_LOGS],
      profiles: [...INITIAL_PROFILES],
      authCredentials: {
        [SUPER_ADMIN_EMAIL.toLowerCase()]: {
          passwordHash: hashPassword('SuperAdmin@2026'),
          updatedAt: new Date().toISOString(),
        },
      },
      followedClubsByUser: {},
      bookmarkedEventsByUser: {},
      readNotificationsByUser: {},
    };
    saveDatabase(db);
    return db;
  }

  // Merge any newly added initial clubs idempotently
  let changed = false;
  for (const initClub of INITIAL_CLUBS) {
    const exists = db.clubs.some(
      (c) => c.id === initClub.id || c.name.toLowerCase() === initClub.name.toLowerCase()
    );
    if (!exists) {
      db.clubs.push(initClub);
      changed = true;
    }
  }
  if (!Array.isArray(db.profiles)) {
    db.profiles = [...INITIAL_PROFILES];
    changed = true;
  }
  if (!db.authCredentials || typeof db.authCredentials !== 'object') {
    db.authCredentials = {};
    changed = true;
  }
  if (!db.followedClubsByUser || typeof db.followedClubsByUser !== 'object') {
    db.followedClubsByUser = {};
    changed = true;
  }
  if (!db.bookmarkedEventsByUser || typeof db.bookmarkedEventsByUser !== 'object') {
    db.bookmarkedEventsByUser = {};
    changed = true;
  }
  if (!db.readNotificationsByUser || typeof db.readNotificationsByUser !== 'object') {
    db.readNotificationsByUser = {};
    changed = true;
  }
  const superAdminKey = SUPER_ADMIN_EMAIL.toLowerCase();
  if (!db.authCredentials[superAdminKey]) {
    db.authCredentials[superAdminKey] = {
      passwordHash: hashPassword('SuperAdmin@2026'),
      updatedAt: new Date().toISOString(),
    };
    changed = true;
  }
  for (const evt of db.events) {
    if (typeof evt.poster_url === 'string' && evt.poster_url.startsWith('/src/assets/images/')) {
      evt.poster_url = evt.poster_url.replace('/src/assets/images/', '/images/');
      changed = true;
    }
  }
  if (changed) {
    saveDatabase(db);
  }

  return db;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function resolveRoleForEmail(database: PortalDatabase, email: string) {
  const clean = email.trim().toLowerCase();
  if (isSuperAdminEmail(clean)) {
    return {
      role: 'super_admin' as const,
      assignedClubIds: database.clubs.map((c) => c.id),
    };
  }
  const assignedClubIds = database.clubAdmins
    .filter((ca) => ca.user_email?.toLowerCase() === clean)
    .map((ca) => ca.club_id);
  if (assignedClubIds.length > 0) {
    return {
      role: 'club_admin' as const,
      assignedClubIds,
    };
  }
  return {
    role: 'normal' as const,
    assignedClubIds: [] as string[],
  };
}

function saveDatabase(db: PortalDatabase, skipRemoteUpload: boolean = false) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  db.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  if (!skipRemoteUpload) {
    supabaseService.queuePortalSnapshotUpload(db);
  }
}

const hadLocalDbFileAtBoot = fs.existsSync(DB_FILE);
let db = loadDatabase();

async function syncWithSupabaseOnStartup() {
  if (!supabaseService.isConfigured()) return;

  try {
    const remote = await supabaseService.downloadPortalSnapshot();
    const localTime = db.lastUpdatedAt ? new Date(db.lastUpdatedAt).getTime() : 0;
    const remoteTime = remote?.lastUpdatedAt ? new Date(remote.lastUpdatedAt).getTime() : 0;

    if (remote && (!hadLocalDbFileAtBoot || remoteTime > localTime)) {
      db = {
        ...db,
        ...remote,
        clubs: Array.isArray(remote.clubs) && remote.clubs.length > 0 ? remote.clubs : db.clubs,
        events: Array.isArray(remote.events) ? remote.events : db.events,
        announcements: Array.isArray(remote.announcements) ? remote.announcements : db.announcements,
        clubAdmins: Array.isArray(remote.clubAdmins) ? remote.clubAdmins : db.clubAdmins,
        activityLogs: Array.isArray(remote.activityLogs) ? remote.activityLogs : db.activityLogs,
        profiles: Array.isArray(remote.profiles) ? remote.profiles : db.profiles,
        authCredentials: {
          ...(db.authCredentials || {}),
          ...(remote.authCredentials || {}),
        },
        followedClubsByUser: remote.followedClubsByUser || db.followedClubsByUser || {},
        bookmarkedEventsByUser: remote.bookmarkedEventsByUser || db.bookmarkedEventsByUser || {},
        readNotificationsByUser: remote.readNotificationsByUser || db.readNotificationsByUser || {},
      };
      for (const initClub of INITIAL_CLUBS) {
        if (!db.clubs.some((c) => c.id === initClub.id || c.name.toLowerCase() === initClub.name.toLowerCase())) {
          db.clubs.push(initClub);
        }
      }
      for (const evt of db.events) {
        if (typeof evt.poster_url === 'string' && evt.poster_url.startsWith('/src/assets/images/')) {
          evt.poster_url = evt.poster_url.replace('/src/assets/images/', '/images/');
        }
      }
      saveDatabase(db, true);
    } else {
      await supabaseService.uploadPortalSnapshotNow(db);
    }

    const supaUsers = await supabaseService.confirmExistingIITDHUsers(isIITDHEmail);
    let profilesUpdated = false;
    for (const u of supaUsers) {
      if (!u.email) continue;
      const clean = u.email.trim().toLowerCase();
      if (!isIITDHEmail(clean)) continue;
      const existing = db.profiles.find((p) => p.email.toLowerCase() === clean);
      const metaName =
        typeof u.user_metadata?.full_name === 'string' && u.user_metadata.full_name.trim()
          ? u.user_metadata.full_name.trim()
          : clean.split('@')[0];
      if (!existing) {
        db.profiles.push({
          id: u.id,
          email: clean,
          full_name: metaName,
          created_at: u.created_at || new Date().toISOString(),
        });
        profilesUpdated = true;
      } else if (existing.full_name === clean.split('@')[0] && metaName !== existing.full_name) {
        existing.full_name = metaName;
        profilesUpdated = true;
      }
    }
    if (profilesUpdated) {
      saveDatabase(db);
    }

    await supabaseService.checkPostgresTablesReady();
  } catch (err) {
    console.warn('Supabase startup sync warning:', err);
  }
}

function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

const IITDH_EMAIL_REGEX = /^[a-z0-9._%+-]+@iitdh\.ac\.in$/;

function isIITDHEmail(email?: string): boolean {
  if (!email) return false;
  return IITDH_EMAIL_REGEX.test(email.trim().toLowerCase());
}

function isClubAdminFor(email: string | undefined, clubId: string): boolean {
  if (!email) return false;
  if (isSuperAdminEmail(email)) return true;
  const clean = email.trim().toLowerCase();
  return db.clubAdmins.some(
    (ca) => ca.user_email?.toLowerCase() === clean && ca.club_id === clubId
  );
}

function isAnyAdmin(email?: string): boolean {
  if (!email) return false;
  if (isSuperAdminEmail(email)) return true;
  const clean = email.trim().toLowerCase();
  return db.clubAdmins.some((ca) => ca.user_email?.toLowerCase() === clean);
}

type RealtimeServerMessage =
  | {
      type: 'state:init';
      payload: {
        clubs: Club[];
        events: EventItem[];
        announcements: AnnouncementItem[];
        clubAdmins: ClubAdminAssignment[];
        activityLogs: ActivityLogItem[];
        profiles: Profile[];
      };
    }
  | { type: 'event:created'; payload: EventItem }
  | { type: 'event:updated'; payload: EventItem }
  | { type: 'event:deleted'; payload: { id: string } }
  | { type: 'announcement:created'; payload: AnnouncementItem }
  | { type: 'announcement:updated'; payload: AnnouncementItem }
  | { type: 'announcement:deleted'; payload: { id: string } }
  | { type: 'club:created'; payload: Club }
  | { type: 'club:updated'; payload: Club }
  | { type: 'club:deleted'; payload: { id: string } }
  | { type: 'club_admin:assigned'; payload: ClubAdminAssignment }
  | { type: 'club_admin:removed'; payload: { id: string } }
  | { type: 'activity:created'; payload: ActivityLogItem }
  | { type: 'pong' };

const wsClients = new Set<WebSocket>();
const sseClients = new Set<express.Response>();

function broadcastRealtime(message: RealtimeServerMessage) {
  const serialized = JSON.stringify(message);

  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(serialized);
      } catch {
        wsClients.delete(client);
      }
    }
  }

  for (const res of sseClients) {
    try {
      res.write(`data: ${serialized}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  }
}

function appendActivityLog(
  actorEmail: string,
  action: string,
  targetType: 'event' | 'announcement' | 'club' | 'admin',
  targetId?: string
): ActivityLogItem {
  const newLog: ActivityLogItem = {
    id: crypto.randomUUID(),
    actor_id: actorEmail,
    actor_email: actorEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    created_at: new Date().toISOString(),
  };
  db.activityLogs.unshift(newLog);
  if (db.activityLogs.length > 200) {
    db.activityLogs = db.activityLogs.slice(0, 200);
  }
  return newLog;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && req.path.startsWith('/api')) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    next(err);
  });

  // Health check
  app.get(['/api/health', '/api/portal/health'], (_req, res) => {
    res.json({
      ok: true,
      clubs: db.clubs.length,
      announcements: db.announcements.length,
      supabaseConfigured: supabaseService.isConfigured(),
    });
  });

  // Server-Sent Events real-time fallback stream
  app.get('/api/portal/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const initMsg: RealtimeServerMessage = {
      type: 'state:init',
      payload: {
        clubs: db.clubs,
        events: db.events,
        announcements: db.announcements,
        clubAdmins: db.clubAdmins,
        activityLogs: db.activityLogs,
        profiles: db.profiles,
      },
    };
    res.write(`data: ${JSON.stringify(initMsg)}\n\n`);
    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Get complete synchronized portal state
  app.get('/api/portal/state', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({
      clubs: db.clubs,
      events: db.events,
      announcements: db.announcements,
      clubAdmins: db.clubAdmins,
      activityLogs: db.activityLogs,
      profiles: db.profiles,
      followedClubsByUser: db.followedClubsByUser || {},
      bookmarkedEventsByUser: db.bookmarkedEventsByUser || {},
      readNotificationsByUser: db.readNotificationsByUser || {},
    });
  });

  // --- FOLLOWED CLUBS & NOTIFICATION READ STATE ---
  app.post('/api/portal/follows', (req, res) => {
    const { email, clubId } = req.body as { email?: string; clubId?: string };
    const cleanEmail = email?.trim().toLowerCase() || '';
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({ error: 'Only official @iitdh.ac.in accounts can follow clubs.' });
      return;
    }
    if (!clubId || !db.clubs.some((c) => c.id === clubId)) {
      res.status(404).json({ error: 'Club not found.' });
      return;
    }

    db.followedClubsByUser = db.followedClubsByUser || {};
    const current = db.followedClubsByUser[cleanEmail] || [];
    const exists = current.includes(clubId);
    const updated = exists ? current.filter((id) => id !== clubId) : [...current, clubId];
    db.followedClubsByUser[cleanEmail] = updated;
    saveDatabase(db);
    res.json({ followedClubIds: updated, following: !exists });
  });

  app.post('/api/portal/bookmarks', (req, res) => {
    const { email, eventId } = req.body as { email?: string; eventId?: string };
    const cleanEmail = email?.trim().toLowerCase() || '';
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({ error: 'Only official @iitdh.ac.in accounts can bookmark events.' });
      return;
    }
    if (!eventId || !db.events.some((e) => e.id === eventId)) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    db.bookmarkedEventsByUser = db.bookmarkedEventsByUser || {};
    const current = db.bookmarkedEventsByUser[cleanEmail] || [];
    const exists = current.includes(eventId);
    const updated = exists ? current.filter((id) => id !== eventId) : [...current, eventId];
    db.bookmarkedEventsByUser[cleanEmail] = updated;
    saveDatabase(db);
    res.json({ bookmarkedEventIds: updated, bookmarked: !exists });
  });

  app.post('/api/portal/notifications/read', (req, res) => {
    const { email, notificationIds } = req.body as {
      email?: string;
      notificationIds?: string[];
    };
    const cleanEmail = email?.trim().toLowerCase() || '';
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({ error: 'Only official @iitdh.ac.in accounts can update notification state.' });
      return;
    }
    if (!Array.isArray(notificationIds)) {
      res.status(400).json({ error: 'notificationIds array is required.' });
      return;
    }

    db.readNotificationsByUser = db.readNotificationsByUser || {};
    const current = new Set(db.readNotificationsByUser[cleanEmail] || []);
    for (const id of notificationIds) {
      if (typeof id === 'string' && id.trim()) {
        current.add(id.trim());
      }
    }
    // Cap stored IDs at 500 most recent entries to keep file compact
    const merged = Array.from(current).slice(-500);
    db.readNotificationsByUser[cleanEmail] = merged;
    saveDatabase(db);
    res.json({ readIds: merged });
  });

  // Register or update institutional user profile
  app.post('/api/portal/profiles', (req, res) => {
    const { email, fullName } = req.body as { email?: string; fullName?: string };
    if (!email || !isIITDHEmail(email)) {
      res.status(400).json({ error: 'Only valid @iitdh.ac.in email addresses are permitted.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (fullName && fullName.trim()) {
        existing.full_name = fullName.trim();
        saveDatabase(db);
      }
      res.json(existing);
      return;
    }

    const newProfile: Profile = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      full_name: fullName?.trim() || cleanEmail.split('@')[0],
      created_at: new Date().toISOString(),
    };
    db.profiles.push(newProfile);
    saveDatabase(db);
    res.status(201).json(newProfile);
  });

  // --- AUTHENTICATION (Sign Up, Login, Reset Password, JWKS Verify) ---
  app.post('/api/portal/auth/signup', async (req, res) => {
    const { email, password, fullName } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
    };
    const cleanEmail = email?.trim().toLowerCase() || '';
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({
        error: 'Registration rejected: Only valid IIT Dharwad institutional emails (@iitdh.ac.in) are permitted.',
      });
      return;
    }
    if (!fullName || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
      return;
    }

    db.authCredentials = db.authCredentials || {};
    const existingRemote = await supabaseService.findAuthUserByEmail(cleanEmail);
    if (db.authCredentials[cleanEmail] || existingRemote) {
      res.status(409).json({
        error: 'An account with this @iitdh.ac.in email is already registered. Please sign in with your password.',
        code: 'ACCOUNT_EXISTS',
      });
      return;
    }

    const supaCreate = await supabaseService.createConfirmedUser({
      email: cleanEmail,
      password,
      fullName: fullName.trim(),
    });
    if (supaCreate.alreadyExists) {
      res.status(409).json({
        error: 'An account with this @iitdh.ac.in email is already registered. Please sign in with your password.',
        code: 'ACCOUNT_EXISTS',
      });
      return;
    }

    db.authCredentials[cleanEmail] = {
      passwordHash: hashPassword(password),
      updatedAt: new Date().toISOString(),
    };

    let profile = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (profile) {
      profile.full_name = fullName.trim();
    } else {
      profile = {
        id: supaCreate.user?.id || crypto.randomUUID(),
        email: cleanEmail,
        full_name: fullName.trim(),
        created_at: new Date().toISOString(),
      };
      db.profiles.push(profile);
    }

    saveDatabase(db);
    const { role, assignedClubIds } = resolveRoleForEmail(db, cleanEmail);
    res.status(201).json({ profile, role, assignedClubIds });
  });

  app.post('/api/portal/auth/login', async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = email?.trim().toLowerCase() || '';
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({
        error: 'Access restricted: Please enter a valid IIT Dharwad institutional email (@iitdh.ac.in).',
      });
      return;
    }
    if (!password || password.length === 0) {
      res.status(400).json({ error: 'Please enter your password to sign in.' });
      return;
    }

    db.authCredentials = db.authCredentials || {};
    const cred = db.authCredentials[cleanEmail];
    let verifiedLocally = Boolean(cred && verifyPassword(password, cred.passwordHash));
    let supaAccessToken: string | undefined;
    let supaUserId: string | undefined;
    let supaFullName: string | undefined;

    if (verifiedLocally) {
      // Best-effort ensure user exists in Supabase Auth as confirmed
      const profileName =
        db.profiles.find((p) => p.email.toLowerCase() === cleanEmail)?.full_name ||
        cleanEmail.split('@')[0];
      void supabaseService
        .createConfirmedUser({ email: cleanEmail, password, fullName: profileName })
        .catch(() => {});
    } else {
      // Verify against Supabase Auth (handles users registered in Supabase Auth across devices)
      const supaLogin = await supabaseService.verifyPasswordLogin(cleanEmail, password);
      if (supaLogin.user) {
        if (supaLogin.accessToken) {
          const claims = await supabaseService.verifyJwt(supaLogin.accessToken);
          if (claims) {
            supaAccessToken = supaLogin.accessToken;
          }
        }
        verifiedLocally = true;
        supaUserId = supaLogin.user.id;
        const metaName = supaLogin.user.user_metadata?.full_name;
        if (typeof metaName === 'string' && metaName.trim()) {
          supaFullName = metaName.trim();
        }
        db.authCredentials[cleanEmail] = {
          passwordHash: hashPassword(password),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    if (!verifiedLocally) {
      const existingRemote = await supabaseService.findAuthUserByEmail(cleanEmail);
      if (!cred && !existingRemote) {
        res.status(401).json({
          error: 'This @iitdh.ac.in account has not set a portal password yet. Switch to New Registration to create your account.',
          code: 'ACCOUNT_NOT_REGISTERED',
        });
        return;
      }
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    let profile = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    let profileChanged = false;
    if (!profile) {
      profile = {
        id: supaUserId || crypto.randomUUID(),
        email: cleanEmail,
        full_name: supaFullName || cleanEmail.split('@')[0],
        created_at: new Date().toISOString(),
      };
      db.profiles.push(profile);
      profileChanged = true;
    } else if (supaFullName && profile.full_name === cleanEmail.split('@')[0]) {
      profile.full_name = supaFullName;
      profileChanged = true;
    }

    if (profileChanged || supaUserId) {
      saveDatabase(db);
    }

    const { role, assignedClubIds } = resolveRoleForEmail(db, cleanEmail);
    res.json({ profile, role, assignedClubIds, accessToken: supaAccessToken });
  });

  app.post('/api/portal/auth/reset-password', async (req, res) => {
    const { email, newPassword } = req.body as { email?: string; newPassword?: string };
    const cleanEmail = email?.trim().toLowerCase() || '';
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({
        error: 'Only valid IIT Dharwad institutional emails (@iitdh.ac.in) are permitted.',
      });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
      return;
    }

    let profile = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    const updatedSupa = await supabaseService.updateOrCreatePassword(
      cleanEmail,
      newPassword,
      profile?.full_name
    );

    db.authCredentials = db.authCredentials || {};
    db.authCredentials[cleanEmail] = {
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    };

    if (!profile) {
      profile = {
        id: updatedSupa.user?.id || crypto.randomUUID(),
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        created_at: new Date().toISOString(),
      };
      db.profiles.push(profile);
    }

    saveDatabase(db);
    const { role, assignedClubIds } = resolveRoleForEmail(db, cleanEmail);
    res.json({ success: true, profile, role, assignedClubIds });
  });

  app.post('/api/portal/auth/verify-token', async (req, res) => {
    const authHeader = req.headers.authorization;
    const bearer =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token = bearer || (req.body as { token?: string })?.token;
    if (!token) {
      res.status(400).json({ valid: false, error: 'JWT token is required.' });
      return;
    }
    const claims = await supabaseService.verifyJwt(token);
    if (!claims || !claims.email || !isIITDHEmail(claims.email)) {
      res.status(401).json({ valid: false, error: 'Invalid or expired Supabase token.' });
      return;
    }
    const { role, assignedClubIds } = resolveRoleForEmail(db, claims.email);
    res.json({ valid: true, claims, role, assignedClubIds });
  });

  // --- CLUBS CRUD (Super Admin only) ---
  app.post('/api/portal/clubs', (req, res) => {
    const { club, actorEmail } = req.body as { club: Omit<Club, 'id' | 'created_at'>; actorEmail?: string };
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can create clubs.' });
      return;
    }

    const newClub: Club = {
      ...club,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    db.clubs.unshift(newClub);
    const log = appendActivityLog(actorEmail!, `Created club "${newClub.name}"`, 'club', newClub.id);
    saveDatabase(db);
    broadcastRealtime({ type: 'club:created', payload: newClub });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.status(201).json(newClub);
  });

  app.put('/api/portal/clubs/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorEmail } = req.body as { updates: Partial<Club>; actorEmail?: string };
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can update clubs.' });
      return;
    }

    const index = db.clubs.findIndex((c) => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Club not found.' });
      return;
    }

    const updated = { ...db.clubs[index], ...updates };
    db.clubs[index] = updated;
    const log = appendActivityLog(actorEmail!, `Updated club details for "${updated.name}"`, 'club', id);
    saveDatabase(db);
    broadcastRealtime({ type: 'club:updated', payload: updated });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json(updated);
  });

  app.delete('/api/portal/clubs/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can delete clubs.' });
      return;
    }

    const club = db.clubs.find((c) => c.id === id);
    const clubName = club?.name || 'Club';
    db.clubs = db.clubs.filter((c) => c.id !== id);
    db.events = db.events.filter((e) => e.club_id !== id);
    db.announcements = db.announcements.filter((a) => a.club_id !== id);
    db.clubAdmins = db.clubAdmins.filter((ca) => ca.club_id !== id);
    const log = appendActivityLog(actorEmail!, `Deleted club "${clubName}" and related records`, 'club', id);
    saveDatabase(db);
    broadcastRealtime({ type: 'club:deleted', payload: { id } });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json({ success: true });
  });

  // --- EVENTS CRUD ---
  app.post('/api/portal/events', (req, res) => {
    const { event, actorEmail } = req.body as {
      event: Omit<EventItem, 'id' | 'created_at' | 'club'>;
      actorEmail?: string;
    };
    if (!event?.club_id || !isClubAdminFor(actorEmail, event.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to create events for this club.' });
      return;
    }

    const dateCheck = validateAndSanitizeEventDates({
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      registration_deadline: event.registration_deadline,
    });
    if (!dateCheck.valid) {
      res.status(400).json({ error: dateCheck.error });
      return;
    }

    const newEvent: EventItem = {
      ...event,
      status: event.status || 'Published',
      event_date: dateCheck.sanitized.event_date,
      start_time: dateCheck.sanitized.start_time,
      end_time: dateCheck.sanitized.end_time,
      registration_deadline: dateCheck.sanitized.registration_deadline ?? undefined,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.events.unshift(newEvent);
    const log = appendActivityLog(actorEmail!, `Created event "${newEvent.title}"`, 'event', newEvent.id);
    saveDatabase(db);
    broadcastRealtime({ type: 'event:created', payload: newEvent });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.status(201).json(newEvent);
  });

  app.put('/api/portal/events/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorEmail } = req.body as { updates: Partial<EventItem>; actorEmail?: string };
    const index = db.events.findIndex((e) => e.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const existing = db.events[index];
    const targetClubId = updates.club_id || existing.club_id;
    if (!isClubAdminFor(actorEmail, existing.club_id) || !isClubAdminFor(actorEmail, targetClubId)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to modify this event.' });
      return;
    }

    const dateCheck = validateAndSanitizeEventDates({
      event_date: updates.event_date !== undefined ? updates.event_date : existing.event_date,
      start_time: updates.start_time !== undefined ? updates.start_time : existing.start_time,
      end_time: updates.end_time !== undefined ? updates.end_time : existing.end_time,
      registration_deadline:
        updates.registration_deadline !== undefined
          ? updates.registration_deadline
          : existing.registration_deadline,
    });
    if (!dateCheck.valid) {
      res.status(400).json({ error: dateCheck.error });
      return;
    }

    const updated: EventItem = {
      ...existing,
      ...updates,
      event_date: dateCheck.sanitized.event_date,
      start_time: dateCheck.sanitized.start_time,
      end_time: dateCheck.sanitized.end_time,
      registration_deadline: dateCheck.sanitized.registration_deadline ?? undefined,
      updated_at: new Date().toISOString(),
    };
    db.events[index] = updated;
    const log = appendActivityLog(actorEmail!, `Updated event "${updated.title}"`, 'event', id);
    saveDatabase(db);
    broadcastRealtime({ type: 'event:updated', payload: updated });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json(updated);
  });

  app.delete('/api/portal/events/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    const existing = db.events.find((e) => e.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    if (!isClubAdminFor(actorEmail, existing.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to delete this event.' });
      return;
    }

    db.events = db.events.filter((e) => e.id !== id);
    const log = appendActivityLog(actorEmail!, `Deleted event "${existing.title}"`, 'event', id);
    saveDatabase(db);
    broadcastRealtime({ type: 'event:deleted', payload: { id } });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json({ success: true });
  });

  // --- ANNOUNCEMENTS CRUD ---
  app.post('/api/portal/announcements', (req, res) => {
    const { announcement, actorEmail } = req.body as {
      announcement: Omit<AnnouncementItem, 'id' | 'created_at' | 'club'>;
      actorEmail?: string;
    };

    if (announcement.type === 'Campus-wide Announcement' || !announcement.club_id) {
      if (!isSuperAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden: Only Super Admin can publish campus-wide announcements.' });
        return;
      }
    } else if (!isClubAdminFor(actorEmail, announcement.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to publish announcements for this club.' });
      return;
    }

    const normalizedType =
      announcement.type === 'Campus-wide Announcement' || !announcement.club_id
        ? 'Campus-wide Announcement'
        : 'Club Announcement';

    const newAnnouncement: AnnouncementItem = {
      ...announcement,
      type: normalizedType,
      club_id: normalizedType === 'Campus-wide Announcement' ? null : announcement.club_id ?? null,
      status: announcement.status || 'Published',
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: announcement.published_at || new Date().toISOString(),
    };
    db.announcements.unshift(newAnnouncement);
    const log = appendActivityLog(actorEmail!, `Published announcement "${newAnnouncement.title}"`, 'announcement', newAnnouncement.id);
    saveDatabase(db);
    broadcastRealtime({ type: 'announcement:created', payload: newAnnouncement });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.status(201).json(newAnnouncement);
  });

  app.put('/api/portal/announcements/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorEmail } = req.body as {
      updates: Partial<AnnouncementItem>;
      actorEmail?: string;
    };
    const index = db.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    const existing = db.announcements[index];
    const targetType = updates.type || existing.type;
    const targetClubId = updates.club_id !== undefined ? updates.club_id : existing.club_id;

    if (existing.club_id === null || targetType === 'Campus-wide Announcement' || !targetClubId) {
      if (!isSuperAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden: Only Super Admin can update campus-wide announcements.' });
        return;
      }
    } else {
      if (
        (existing.club_id && !isClubAdminFor(actorEmail, existing.club_id)) ||
        !isClubAdminFor(actorEmail, targetClubId)
      ) {
        res.status(403).json({ error: 'Forbidden: Not authorized to edit this announcement.' });
        return;
      }
    }

    const updated: AnnouncementItem = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    db.announcements[index] = updated;
    const log = appendActivityLog(actorEmail!, `Updated announcement "${updated.title}"`, 'announcement', id);
    saveDatabase(db);
    broadcastRealtime({ type: 'announcement:updated', payload: updated });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json(updated);
  });

  app.delete('/api/portal/announcements/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    const existing = db.announcements.find((a) => a.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    if (!existing.club_id) {
      if (!isSuperAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden: Only Super Admin can delete campus-wide announcements.' });
        return;
      }
    } else if (!isClubAdminFor(actorEmail, existing.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to delete this announcement.' });
      return;
    }

    db.announcements = db.announcements.filter((a) => a.id !== id);
    const log = appendActivityLog(actorEmail!, `Deleted announcement "${existing.title}"`, 'announcement', id);
    saveDatabase(db);
    broadcastRealtime({ type: 'announcement:deleted', payload: { id } });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json({ success: true });
  });

  // --- CLUB ADMINS CRUD (Super Admin only) ---
  app.post('/api/portal/club-admins', (req, res) => {
    const { userEmail, clubId, actorEmail } = req.body as {
      userEmail?: string;
      clubId?: string;
      actorEmail?: string;
    };
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can assign club admins.' });
      return;
    }
    if (!userEmail || !clubId) {
      res.status(400).json({ error: 'userEmail and clubId are required.' });
      return;
    }

    const club = db.clubs.find((c) => c.id === clubId);
    if (!club) {
      res.status(404).json({ error: 'Club not found.' });
      return;
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    if (!isIITDHEmail(cleanEmail)) {
      res.status(400).json({ error: 'Only valid @iitdh.ac.in accounts can be assigned as club admins.' });
      return;
    }
    const existing = db.clubAdmins.find(
      (ca) => ca.user_email?.toLowerCase() === cleanEmail && ca.club_id === clubId
    );
    if (existing) {
      res.json(existing);
      return;
    }

    const profile = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    const newAssignment: ClubAdminAssignment = {
      id: crypto.randomUUID(),
      user_id: profile?.id || crypto.randomUUID(),
      user_email: cleanEmail,
      club_id: clubId,
      club_name: club.name,
      assigned_by: actorEmail,
      created_at: new Date().toISOString(),
    };
    db.clubAdmins.unshift(newAssignment);
    const log = appendActivityLog(actorEmail!, `Assigned ${cleanEmail} as admin for ${club.name}`, 'admin', newAssignment.id);
    saveDatabase(db);
    broadcastRealtime({ type: 'club_admin:assigned', payload: newAssignment });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.status(201).json(newAssignment);
  });

  app.delete('/api/portal/club-admins/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can remove club admins.' });
      return;
    }

    const existing = db.clubAdmins.find((ca) => ca.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    db.clubAdmins = db.clubAdmins.filter((ca) => ca.id !== id);
    const log = appendActivityLog(
      actorEmail!,
      `Removed ${existing.user_email || 'User'} from ${existing.club_name || 'Club'} admin privileges`,
      'admin',
      id
    );
    saveDatabase(db);
    broadcastRealtime({ type: 'club_admin:removed', payload: { id } });
    broadcastRealtime({ type: 'activity:created', payload: log });
    res.json({ success: true });
  });

  // --- ACTIVITY LOG ---
  app.post('/api/portal/activity', (req, res) => {
    const { actorEmail, action, targetType, targetId } = req.body as {
      actorEmail?: string;
      action?: string;
      targetType?: 'event' | 'announcement' | 'club' | 'admin';
      targetId?: string;
    };
    if (!isAnyAdmin(actorEmail)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (action && targetType) {
      const log = appendActivityLog(actorEmail!, action, targetType, targetId);
      saveDatabase(db);
      broadcastRealtime({ type: 'activity:created', payload: log });
    }
    res.json({ ok: true });
  });

  // Return JSON 404 for any unmatched /api/* route instead of HTML
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite Dev Middleware or Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (reqUrl.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
    wsClients.add(ws);

    // Send initial authoritative portal snapshot over WebSocket
    const initMsg: RealtimeServerMessage = {
      type: 'state:init',
      payload: {
        clubs: db.clubs,
        events: db.events,
        announcements: db.announcements,
        clubAdmins: db.clubAdmins,
        activityLogs: db.activityLogs,
        profiles: db.profiles,
      },
    };
    try {
      ws.send(JSON.stringify(initMsg));
    } catch {}

    ws.on('pong', () => {
      (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
    });

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString()) as { type?: string };
        if (msg?.type === 'ping' && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (msg?.type === 'state:request' && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'state:init',
              payload: {
                clubs: db.clubs,
                events: db.events,
                announcements: db.announcements,
                clubAdmins: db.clubAdmins,
                activityLogs: db.activityLogs,
                profiles: db.profiles,
              },
            })
          );
        }
      } catch {}
    });

    ws.on('close', () => {
      wsClients.delete(ws);
    });

    ws.on('error', () => {
      wsClients.delete(ws);
    });
  });

  const wsHeartbeat = setInterval(() => {
    for (const client of wsClients) {
      const tracked = client as WebSocket & { isAlive?: boolean };
      if (tracked.isAlive === false) {
        wsClients.delete(client);
        client.terminate();
        continue;
      }
      tracked.isAlive = false;
      try {
        client.ping();
      } catch {}
    }
  }, 30000);

  httpServer.on('close', () => {
    clearInterval(wsHeartbeat);
  });

  await syncWithSupabaseOnStartup();

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`IIT Dharwad Campus Events Portal server + WebSocket listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
