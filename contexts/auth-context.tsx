'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberedAdminUserId, setRememberedAdminUserId] = useState<string | null>(null);

  const supabase = createClient();

  const getFallbackProfile = useCallback((authUser: User): Profile => ({
    id: authUser.id,
    full_name: authUser.user_metadata?.full_name || null,
    email: authUser.email || null,
    phone: authUser.phone || null,
    role: authUser.app_metadata?.role === 'admin' || authUser.user_metadata?.role === 'admin'
      ? 'admin'
      : 'customer',
    avatar_url: null,
  }), []);

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, avatar_url')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        setProfile(getFallbackProfile(authUser));
        return;
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        setProfile(getFallbackProfile(authUser));
      }
    } catch {
      setProfile(getFallbackProfile(authUser));
    }
  }, [getFallbackProfile, supabase]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const signOut = async () => {
    try {
      // Call the server-side signout endpoint to clear httpOnly cookies
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      // Also call client-side signOut to clear any client state
      await supabase.auth.signOut({ scope: 'global' });

      // Clear localStorage items related to Supabase
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          localStorage.removeItem(key);
        }
      }

      // Clear state immediately
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (err) {
      // Even if there's an error, clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      throw err;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      try {
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        try {
          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setProfile(null);
          }
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  useEffect(() => {
    if (!user) {
      setRememberedAdminUserId(null);
      return;
    }

    setRememberedAdminUserId(localStorage.getItem('calleocho-admin-user-id'));
  }, [user]);

  const metadataIsAdmin =
    user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
  const profileIsAdmin = profile?.role === 'admin';
  const isAdmin =
    !!user &&
    (profileIsAdmin || metadataIsAdmin || rememberedAdminUserId === user.id);

  useEffect(() => {
    if (!user || !isAdmin) return;

    localStorage.setItem('calleocho-admin-user-id', user.id);
    setRememberedAdminUserId(user.id);
  }, [isAdmin, user]);

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
