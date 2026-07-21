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

const AUTH_REQUEST_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('La solicitud de sesión tardó demasiado.'));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}

function clearStoredAuthData() {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);

    if (
      key &&
      (key.includes('supabase') ||
        key.includes('sb-') ||
        key === 'calleocho-admin-user-id')
    ) {
      localStorage.removeItem(key);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberedAdminUserId, setRememberedAdminUserId] = useState<string | null>(null);
  const [serverIsAdmin, setServerIsAdmin] = useState(false);

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
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, avatar_url')
          .eq('id', authUser.id)
          .maybeSingle()
      );

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

  const refreshServerProfile = useCallback(async () => {
    try {
      const response = await withTimeout(
        fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })
      );
      const data = await response.json();

      setServerIsAdmin(Boolean(data.isAdmin));

      if (data.profile) {
        setProfile(data.profile as Profile);
      }
    } catch {
      setServerIsAdmin(false);
    }
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
      await refreshServerProfile();
    }
  };

  const loadAuthState = useCallback(async () => {
    try {
      const {
        data: { session: currentSession },
      } = await withTimeout(supabase.auth.getSession());

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user);
        await refreshServerProfile();
        return;
      }

      const {
        data: { user: currentUser },
      } = await withTimeout(supabase.auth.getUser());

      setSession(null);
      setUser(currentUser ?? null);

      if (currentUser) {
        await fetchProfile(currentUser);
        await refreshServerProfile();
      } else {
        setProfile(null);
        setServerIsAdmin(false);
      }
    } catch {
      setSession(null);
      setUser(null);
      setProfile(null);
      setServerIsAdmin(false);
    }
  }, [fetchProfile, refreshServerProfile, supabase]);

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
    setRememberedAdminUserId(null);
    setServerIsAdmin(false);
    clearStoredAuthData();

    await Promise.allSettled([
      withTimeout(
        fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        }),
        3500
      ),
      withTimeout(supabase.auth.signOut({ scope: 'local' }), 3500),
    ]);
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        await loadAuthState();
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
            await refreshServerProfile();
          } else {
            setProfile(null);
            setServerIsAdmin(false);
          }
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, loadAuthState, refreshServerProfile, supabase]);

  useEffect(() => {
    const refreshVisibleSession = () => {
      if (document.visibilityState === 'visible') {
        void loadAuthState();
      }
    };

    window.addEventListener('focus', refreshVisibleSession);
    window.addEventListener('pageshow', refreshVisibleSession);
    document.addEventListener('visibilitychange', refreshVisibleSession);

    return () => {
      window.removeEventListener('focus', refreshVisibleSession);
      window.removeEventListener('pageshow', refreshVisibleSession);
      document.removeEventListener('visibilitychange', refreshVisibleSession);
    };
  }, [loadAuthState]);

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
    (profileIsAdmin || metadataIsAdmin || serverIsAdmin || rememberedAdminUserId === user.id);

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
