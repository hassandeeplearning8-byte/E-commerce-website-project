'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'viewer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleForUser = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole(null);
      return;
    }

    // First check app_metadata (set by server/admin)
    const appRole = currentUser.app_metadata?.role as UserRole | undefined;
    const userRole = currentUser.user_metadata?.role as UserRole | undefined;

    if (appRole === 'admin' || appRole === 'viewer') {
      setRole(appRole);
      return;
    }

    if (userRole === 'admin' || userRole === 'viewer') {
      setRole(userRole);
      return;
    }

    // Default role is viewer
    setRole('viewer');
  };

  const refreshProfile = async () => {
    try {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      setUser(refreshedUser);
      await fetchRoleForUser(refreshedUser);
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      fetchRoleForUser(currentUser);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        await fetchRoleForUser(currentUser);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      await fetchRoleForUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Login failed.' };
    }
  };

  const signUp = async (email: string, password: string, requestedRole: UserRole = 'viewer') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: requestedRole,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Sync role on server if user was created
      if (data.user) {
        try {
          await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              role: requestedRole,
            }),
          });
        } catch {
          // ignore background sync error
        }
      }

      setUser(data.user);
      setSession(data.session);
      setRole(requestedRole);
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Signup failed.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
