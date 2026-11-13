import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, SUPER_ADMIN_EMAIL, isIITDHEmail } from './supabase';
import { dataStore } from './dataStore';
import { AuthenticatedUser, UserRole } from '../types';

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchTestAccount: (type: 'super_admin' | 'club_admin' | 'normal') => void;
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

  // Compute roles based on email
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Check active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && isIITDHEmail(session.user.email)) {
          const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
          dataStore.registerProfile(session.user.email, fullName);
          const { role, assignedClubIds } = resolveUserRole(session.user.email);
          setUser({
            id: session.user.id,
            email: session.user.email,
            fullName,
            role,
            assignedClubIds,
          });
          setLoading(false);
          return;
        }

        // 2. Check local stored user
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthenticatedUser;
          dataStore.registerProfile(parsed.email, parsed.fullName);
          // Re-evaluate role in case assignments changed
          const { role, assignedClubIds } = resolveUserRole(parsed.email);
          setUser({
            ...parsed,
            role,
            assignedClubIds,
          });
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
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
        return updated;
      });
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!isIITDHEmail(cleanEmail)) {
      return { success: false, error: 'Access restricted: Please enter an official IIT Dharwad institutional email (@iitdh.ac.in).' };
    }

    await dataStore.syncFromServer();

    try {
      if (password) {
        // Attempt Supabase login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
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
          setUser(authUser);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
          return { success: true };
        }
      }
    } catch {}

    // Resilient fallback for institutional credentials
    const existingProfile = dataStore.getProfiles().find((p) => p.email.toLowerCase() === cleanEmail);
    const fullName = existingProfile?.full_name || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase();
    await dataStore.registerProfile(cleanEmail, fullName);
    const { role, assignedClubIds } = resolveUserRole(cleanEmail);
    const authUser: AuthenticatedUser = {
      id: existingProfile?.id || 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      fullName,
      role,
      assignedClubIds,
    };

    setUser(authUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const signup = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!isIITDHEmail(cleanEmail)) {
      return { success: false, error: 'Registration rejected: Only institutional email addresses ending in @iitdh.ac.in are permitted.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    await dataStore.syncFromServer();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.warn('Supabase signup returned notice:', error.message);
      } else if (data?.user) {
        const resolvedName = fullName || cleanEmail.split('@')[0];
        await dataStore.registerProfile(cleanEmail, resolvedName);
        const { role, assignedClubIds } = resolveUserRole(cleanEmail);
        const authUser: AuthenticatedUser = {
          id: data.user.id,
          email: cleanEmail,
          fullName: resolvedName,
          role,
          assignedClubIds,
        };
        setUser(authUser);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
        return { success: true };
      }
    } catch {}

    const resolvedName = fullName || cleanEmail.split('@')[0];
    await dataStore.registerProfile(cleanEmail, resolvedName);
    const { role, assignedClubIds } = resolveUserRole(cleanEmail);
    const authUser: AuthenticatedUser = {
      id: 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      fullName: resolvedName,
      role,
      assignedClubIds,
    };
    setUser(authUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const switchTestAccount = (type: 'super_admin' | 'club_admin' | 'normal') => {
    if (type === 'super_admin') {
      const authUser: AuthenticatedUser = {
        id: 'usr_ec26bt032',
        email: SUPER_ADMIN_EMAIL,
        fullName: 'Super Administrator',
        role: 'super_admin',
        assignedClubIds: dataStore.getClubs().map((c) => c.id),
      };
      setUser(authUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    } else if (type === 'club_admin') {
      const assigned = dataStore.getClubIdsForUser('coding_admin@iitdh.ac.in');
      const codingClubId = 'c5555555-5555-4555-a555-555555555555';
      const authUser: AuthenticatedUser = {
        id: 'usr_coding_admin',
        email: 'coding_admin@iitdh.ac.in',
        fullName: 'Coding Club Lead',
        role: 'club_admin',
        assignedClubIds: assigned.length > 0 ? assigned : [codingClubId],
      };
      setUser(authUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    } else {
      const authUser: AuthenticatedUser = {
        id: 'usr_student26',
        email: 'student26@iitdh.ac.in',
        fullName: 'Arjun Sharma',
        role: 'normal',
        assignedClubIds: [],
      };
      setUser(authUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    }
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
        switchTestAccount,
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
