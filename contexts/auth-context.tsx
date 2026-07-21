'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

const PROFILE_CACHE_KEY = 'calleocho_profile_cache';
const AUTH_TIMEOUT_MS = 4000;

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), AUTH_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const getCachedProfile = (userId: string) => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached) as Profile;
      return parsed.id === userId ? parsed : null;
    } catch {
      return null;
    }
  };

  const cacheProfile = (nextProfile: Profile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
    } catch {
      // Ignore storage failures.
    }
  };

  const ensureProfile = async (authUser: User) => {
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      null;

    const profileData = {
      id: authUser.id,
      email: authUser.email || '',
      full_name: fullName,
      phone: null,
      avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      role: 'customer' as const,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id', ignoreDuplicates: true });

    return profileData as Profile;
  };

  const fetchProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (error) {
        const cachedProfile = getCachedProfile(authUser.id);
        if (cachedProfile) {
          setProfile(cachedProfile);
          return;
        }

        const fallbackProfile = await ensureProfile(authUser);
        setProfile((currentProfile) =>
          currentProfile?.id === authUser.id ? currentProfile : fallbackProfile
        );
        return;
      }

      if (data) {
        const nextProfile = data as Profile;
        setProfile(nextProfile);
        cacheProfile(nextProfile);
      }
    } catch {
      const cachedProfile = getCachedProfile(authUser.id);
      if (cachedProfile) {
        setProfile(cachedProfile);
      }
    }
  };

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
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (err) {
      // Even if there's an error, clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      throw err;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const result = await withTimeout(
        supabase.auth.getSession(),
        { data: { session: null }, error: null }
      );
      const session = result.data.session;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const cachedProfile = getCachedProfile(session.user.id);
        if (cachedProfile) {
          setProfile(cachedProfile);
        }

        void fetchProfile(session.user);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const cachedProfile = getCachedProfile(session.user.id);
          if (cachedProfile) {
            setProfile(cachedProfile);
          }

          void fetchProfile(session.user);
        } else {
          setProfile(null);
          localStorage.removeItem(PROFILE_CACHE_KEY);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAdmin: profile?.role === 'admin',
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
