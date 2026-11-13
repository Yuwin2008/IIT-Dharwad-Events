import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, SUPER_ADMIN_EMAIL, isIITDHEmail } from './supabase';
import { dataStore } from './dataStore';
import { AuthenticatedUser, UserRole } from '../types';

interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<AuthResult>;
  signup: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  switchToSuperAdmin: () => void;
  canAccessAdmin: boolean;
  isSuperAdmin: boolean;
  isClubAdmin: boolean;
  assignedClubs: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'iitdh_auth_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const resolveUserRole = (email: string): { role: UserRole; assignedClubIds: string[] } => {
    const normalized = email.toLowerCase().trim();
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

  const applySessionStoragePolicy = (authUser: AuthenticatedUser) => {
    if (authUser.role === 'super_admin') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    } else {
      // Normal students and Club Admins must stay logged out between visits/reloads
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await dataStore.syncFromServer();

        // 1. Check active Supabase session — only restore Super Admin automatically
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && isIITDHEmail(session.user.email)) {
          const { role, assignedClubIds } = resolveUserRole(session.user.email);
          if (role === 'super_admin') {
            const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            dataStore.registerProfile(session.user.email, fullName);
            const authUser: AuthenticatedUser = {
              id: session.user.id,
              email: session.user.email,
              fullName,
              role,
              assignedClubIds,
            };
            setUser(authUser);
            applySessionStoragePolicy(authUser);
            setLoading(false);
            return;
          } else {
            // Ensure normal student and club admin accounts start logged out
            await supabase.auth.signOut().catch(() => {});
            localStorage.removeItem(LOCAL_USER_KEY);
          }
        }

        // 2. Check local stored user — only restore Super Admin automatically
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthenticatedUser;
          const { role, assignedClubIds } = resolveUserRole(parsed.email);
          if (role === 'super_admin') {
            dataStore.registerProfile(parsed.email, parsed.fullName);
            setUser({
              ...parsed,
              role,
              assignedClubIds,
            });
          } else {
            localStorage.removeItem(LOCAL_USER_KEY);
            setUser(null);
          }
        }
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
    const cleanEmail = email.toLowerCase().trim();
    if (!isIITDHEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Access restricted: Please enter an official IIT Dharwad institutional email (@iitdh.ac.in).',
      };
    }

    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your password to sign in.' };
    }

    await dataStore.syncFromServer();

    // 1. Verify credentials against server portal auth store
    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
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
          return { success: true };
        }

        // Also try Supabase Auth in case account was created directly in Supabase
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
            if (role !== 'super_admin') {
              await supabase.auth.signOut().catch(() => {});
            }
            setUser(authUser);
            applySessionStoragePolicy(authUser);
            return { success: true };
          }
        } catch {}

        return {
          success: false,
          error: body?.error || 'Invalid email or password.',
          code: body?.code,
        };
      }
    } catch {}

    // 2. Fallback to Supabase Auth if Express API is unavailable
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
        if (role !== 'super_admin') {
          await supabase.auth.signOut().catch(() => {});
        }
        setUser(authUser);
        applySessionStoragePolicy(authUser);
        return { success: true };
      }
    } catch {}

    return {
      success: false,
      error: 'Unable to authenticate. Please verify your credentials or register as a new user.',
    };
  };

  const signup = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!isIITDHEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Registration rejected: Only institutional email addresses ending in @iitdh.ac.in are permitted.',
      };
    }

    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 characters).' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    await dataStore.syncFromServer();

    try {
      const res = await fetch('/api/portal/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, fullName: fullName.trim() }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: body?.error || 'Failed to create account.',
            code: body?.code,
          };
        }

        // Optionally mirror signup to Supabase Auth without leaving a persistent session for non-super-admins
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { full_name: fullName.trim() } },
          });
          if (body.role !== 'super_admin') {
            await supabase.auth.signOut().catch(() => {});
          }
        } catch {}

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
        return { success: true };
      }
    } catch {}

    // Fallback to Supabase Auth if Express API is unavailable
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const resolvedName = fullName.trim() || cleanEmail.split('@')[0];
        await dataStore.registerProfile(cleanEmail, resolvedName);
        const { role, assignedClubIds } = resolveUserRole(cleanEmail);
        if (role !== 'super_admin') {
          await supabase.auth.signOut().catch(() => {});
        }
        const authUser: AuthenticatedUser = {
          id: data.user.id,
          email: cleanEmail,
          fullName: resolvedName,
          role,
          assignedClubIds,
        };
        setUser(authUser);
        applySessionStoragePolicy(authUser);
        return { success: true };
      }
    } catch {}

    return { success: false, error: 'Registration service unavailable. Please try again.' };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const switchToSuperAdmin = () => {
    const authUser: AuthenticatedUser = {
      id: 'usr_ec26bt032',
      email: SUPER_ADMIN_EMAIL,
      fullName: 'Super Administrator',
      role: 'super_admin',
      assignedClubIds: dataStore.getClubs().map((c) => c.id),
    };
    setUser(authUser);
    applySessionStoragePolicy(authUser);
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
        logout,
        switchToSuperAdmin,
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
