import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, SUPER_ADMIN_EMAIL, isIITDHEmail, normalizeEmail } from './supabase';
import { dataStore } from './dataStore';
import { AuthenticatedUser, UserRole } from '../types';

interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<AuthResult>;
  signup: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  resetPassword: (email: string, newPassword: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  canAccessAdmin: boolean;
  isSuperAdmin: boolean;
  isClubAdmin: boolean;
  assignedClubs: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'iitdh_auth_user_session';
const FALLBACK_AUTH_KEY = 'iitdh_portal_fallback_auth';

interface LocalCredentialEntry {
  passwordHash: string;
  fullName: string;
  updatedAt: string;
}

async function hashLocalPassword(email: string, password: string): Promise<string> {
  const input = `${normalizeEmail(email)}::${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return input;
}

function loadLocalCredentialStore(): Record<string, LocalCredentialEntry> {
  try {
    const raw = localStorage.getItem(FALLBACK_AUTH_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalCredentialEntry>) : {};
  } catch {
    return {};
  }
}

function saveLocalCredentialStore(store: Record<string, LocalCredentialEntry>) {
  try {
    localStorage.setItem(FALLBACK_AUTH_KEY, JSON.stringify(store));
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const resolveUserRole = (email: string): { role: UserRole; assignedClubIds: string[] } => {
    const normalized = normalizeEmail(email);
    if (normalized === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return {
        role: 'super_admin',
        assignedClubIds: dataStore.getClubs().map((c) => c.id),
      };
    }

    const assigned = dataStore.getClubIdsForUser(normalized);
    if (assigned.length > 0) {
      return {
        role: 'club_admin',
        assignedClubIds: assigned,
      };
    }

    return {
      role: 'normal',
      assignedClubIds: [],
    };
  };

  const applySessionStoragePolicy = (_authUser: AuthenticatedUser) => {
    // All user roles (Students, Club Admins, Super Admins) must stay logged out between visits/reloads
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await dataStore.syncFromServer();

        // Compulsory sign-in policy: clear any persisted Supabase or local session for all user types
        localStorage.removeItem(LOCAL_USER_KEY);
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Re-verify roles if dataStore changes (e.g. admin assigns/removes club privileges)
    const unsubscribe = dataStore.subscribe(() => {
      setUser((prev) => {
        if (!prev) return null;
        const { role, assignedClubIds } = resolveUserRole(prev.email);
        const sameRole = prev.role === role;
        const sameClubs =
          prev.assignedClubIds.length === assignedClubIds.length &&
          prev.assignedClubIds.every((id, i) => id === assignedClubIds[i]);
        if (sameRole && sameClubs) return prev;
        const updated = { ...prev, role, assignedClubIds };
        applySessionStoragePolicy(updated);
        return updated;
      });
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<AuthResult> => {
    const cleanEmail = normalizeEmail(email);
    if (!isIITDHEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Access restricted: Please enter a valid IIT Dharwad institutional email (@iitdh.ac.in).',
      };
    }

    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your password to sign in.' };
    }

    await dataStore.syncFromServer();

    // 1. Verify credentials against Express portal auth API
    let expressReachable = false;
    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        expressReachable = true;
        const body = await res.json();
        if (res.ok && body?.profile) {
          const authUser: AuthenticatedUser = {
            id: body.profile.id,
            email: cleanEmail,
            fullName: body.profile.full_name,
            role: body.role,
            assignedClubIds: body.assignedClubIds || [],
          };
          setUser(authUser);
          applySessionStoragePolicy(authUser);
          await dataStore.syncFromServer();
          return { success: true, role: authUser.role };
        }

        // If Express says not registered, also try Supabase Auth in case user registered directly via Supabase
        if (body?.code === 'ACCOUNT_NOT_REGISTERED') {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (!error && data?.user?.email) {
              const fullName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
              await dataStore.registerProfile(cleanEmail, fullName);
              const { role, assignedClubIds } = resolveUserRole(cleanEmail);
              const authUser: AuthenticatedUser = {
                id: data.user.id,
                email: cleanEmail,
                fullName,
                role,
                assignedClubIds,
              };
              void supabase.auth.signOut().catch(() => {});
              setUser(authUser);
              applySessionStoragePolicy(authUser);
              return { success: true, role };
            }
          } catch {}
        }

        return {
          success: false,
          error: body?.error || 'Invalid email or password.',
          code: body?.code,
        };
      }
    } catch {}

    // 2. Fallback when Express API is unavailable (static/offline hosting): local cache + Supabase
    if (!expressReachable) {
      const localStore = loadLocalCredentialStore();
      const localCred = localStore[cleanEmail];
      if (localCred) {
        const candidateHash = await hashLocalPassword(cleanEmail, password);
        if (candidateHash !== localCred.passwordHash) {
          return { success: false, error: 'Invalid email or password.' };
        }
        await dataStore.registerProfile(cleanEmail, localCred.fullName);
        const { role, assignedClubIds } = resolveUserRole(cleanEmail);
        const authUser: AuthenticatedUser = {
          id: crypto.randomUUID(),
          email: cleanEmail,
          fullName: localCred.fullName,
          role,
          assignedClubIds,
        };
        setUser(authUser);
        applySessionStoragePolicy(authUser);
        return { success: true, role };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user?.email) {
          const fullName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
          await dataStore.registerProfile(cleanEmail, fullName);
          const { role, assignedClubIds } = resolveUserRole(cleanEmail);
          const authUser: AuthenticatedUser = {
            id: data.user.id,
            email: cleanEmail,
            fullName,
            role,
            assignedClubIds,
          };
          void supabase.auth.signOut().catch(() => {});
          setUser(authUser);
          applySessionStoragePolicy(authUser);
          return { success: true, role };
        }
      } catch {}

      return {
        success: false,
        error: 'This @iitdh.ac.in account has not registered a password yet. Switch to New Registration to create your account.',
        code: 'ACCOUNT_NOT_REGISTERED',
      };
    }

    return {
      success: false,
      error: 'Unable to authenticate. Please verify your credentials or register as a new user.',
    };
  };

  const signup = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    const cleanEmail = normalizeEmail(email);
    if (!isIITDHEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Registration rejected: Only valid IIT Dharwad institutional emails (@iitdh.ac.in) are permitted.',
      };
    }

    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 characters).' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    await dataStore.syncFromServer();

    let expressReachable = false;
    try {
      const res = await fetch('/api/portal/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, fullName: fullName.trim() }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        expressReachable = true;
        const body = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: body?.error || 'Failed to create account.',
            code: body?.code,
          };
        }

        const authUser: AuthenticatedUser = {
          id: body.profile.id,
          email: cleanEmail,
          fullName: body.profile.full_name,
          role: body.role,
          assignedClubIds: body.assignedClubIds || [],
        };
        setUser(authUser);
        applySessionStoragePolicy(authUser);
        await dataStore.syncFromServer();
        return { success: true, role: authUser.role };
      }
    } catch {}

    // Fallback when Express API is unavailable
    if (!expressReachable) {
      const localStore = loadLocalCredentialStore();
      if (localStore[cleanEmail]) {
        return {
          success: false,
          error: 'An account with this @iitdh.ac.in email is already registered. Please sign in with your password.',
          code: 'ACCOUNT_EXISTS',
        };
      }

      const passwordHash = await hashLocalPassword(cleanEmail, password);
      localStore[cleanEmail] = {
        passwordHash,
        fullName: fullName.trim(),
        updatedAt: new Date().toISOString(),
      };
      saveLocalCredentialStore(localStore);
      await dataStore.registerProfile(cleanEmail, fullName.trim());

      const { role, assignedClubIds } = resolveUserRole(cleanEmail);
      const authUser: AuthenticatedUser = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        fullName: fullName.trim(),
        role,
        assignedClubIds,
      };
      setUser(authUser);
      applySessionStoragePolicy(authUser);
      return { success: true, role };
    }

    return { success: false, error: 'Registration service unavailable. Please try again.' };
  };

  const resetPassword = async (email: string, newPassword: string): Promise<AuthResult> => {
    const cleanEmail = normalizeEmail(email);
    if (!isIITDHEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Only valid IIT Dharwad institutional emails (@iitdh.ac.in) are permitted.',
      };
    }
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters in length.',
      };
    }

    let expressReachable = false;
    try {
      const res = await fetch('/api/portal/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, newPassword }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        expressReachable = true;
        const body = await res.json();
        if (!res.ok) {
          return { success: false, error: body?.error || 'Failed to reset password.' };
        }
        await dataStore.syncFromServer();
        return { success: true };
      }
    } catch {}

    if (!expressReachable) {
      const localStore = loadLocalCredentialStore();
      const existing = localStore[cleanEmail];
      localStore[cleanEmail] = {
        passwordHash: await hashLocalPassword(cleanEmail, newPassword),
        fullName: existing?.fullName || cleanEmail.split('@')[0],
        updatedAt: new Date().toISOString(),
      };
      saveLocalCredentialStore(localStore);
      return { success: true };
    }

    return { success: false, error: 'Password reset service unavailable. Please try again.' };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const canAccessAdmin = user?.role === 'super_admin' || user?.role === 'club_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isClubAdmin = user?.role === 'club_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        resetPassword,
        logout,
        canAccessAdmin,
        isSuperAdmin,
        isClubAdmin,
        assignedClubs: user?.assignedClubIds || [],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
