'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'customer' | 'admin' | 'seller' | 'warehouse';
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  canAccessAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialIsAdmin?: boolean;
  initialCanAccessAdmin?: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  canAccessAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const AUTH_REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Tiempo de espera agotado.')), timeoutMs);

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

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
  initialIsAdmin = false,
  initialCanAccessAdmin = false,
}: AuthProviderProps) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [serverIsAdmin, setServerIsAdmin] = useState(initialIsAdmin);
  const [serverCanAccessAdmin, setServerCanAccessAdmin] = useState(initialCanAccessAdmin);
  const mountedRef = useRef(true);
  const activeUserIdRef = useRef<string | null>(initialUser?.id ?? null);

  const getFallbackProfile = useCallback((authUser: User): Profile => ({
    id: authUser.id,
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
    email: authUser.email || null,
    phone: authUser.phone || null,
    role: 'customer',
    avatar_url: authUser.user_metadata?.avatar_url || null,
  }), []);

  const fetchServerIdentity = useCallback(async (expectedUserId?: string) => {
    try {
      const response = await withTimeout(
        fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      );

      if (!response.ok) return;
      const data = await response.json();
      if (!mountedRef.current) return;

      if (!data.user) {
        // Only clear the local state when the server explicitly confirms there is no session.
        if (!expectedUserId || activeUserIdRef.current === expectedUserId) {
          activeUserIdRef.current = null;
          setUser(null);
          setSession(null);
          setProfile(null);
          setServerIsAdmin(false);
          setServerCanAccessAdmin(false);
        }
        return;
      }

      if (expectedUserId && data.user.id !== expectedUserId) return;

      activeUserIdRef.current = data.user.id;
      setUser((current) => current ?? (data.user as User));
      if (data.profile) setProfile(data.profile as Profile);
      setServerIsAdmin(Boolean(data.isAdmin));
      setServerCanAccessAdmin(Boolean(data.canAccessAdmin));
    } catch {
      // A temporary network failure must never log the user out or hide the profile menu.
    }
  }, []);

  const fetchProfile = useCallback(async (authUser: User) => {
    const expectedUserId = authUser.id;
    activeUserIdRef.current = expectedUserId;

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, avatar_url')
          .eq('id', expectedUserId)
          .maybeSingle()
      );

      if (!mountedRef.current || activeUserIdRef.current !== expectedUserId) return;

      if (!error && data) {
        setProfile(data as Profile);
        setServerIsAdmin(data.role === 'admin');
        setServerCanAccessAdmin(['admin', 'seller', 'warehouse'].includes(data.role));
      } else {
        setProfile((current) => current?.id === expectedUserId ? current : getFallbackProfile(authUser));
      }
    } catch {
      if (!mountedRef.current || activeUserIdRef.current !== expectedUserId) return;
      setProfile((current) => current?.id === expectedUserId ? current : getFallbackProfile(authUser));
    }

    void fetchServerIdentity(expectedUserId);
  }, [fetchServerIdentity, getFallbackProfile, supabase]);

  const applySession = useCallback((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null;
    setSession(nextSession);
    setUser(nextUser);
    activeUserIdRef.current = nextUser?.id ?? null;

    if (nextUser) {
      setProfile((current) => current?.id === nextUser.id ? current : getFallbackProfile(nextUser));
      void fetchProfile(nextUser);
    } else {
      setProfile(null);
      setServerIsAdmin(false);
      setServerCanAccessAdmin(false);
    }
  }, [fetchProfile, getFallbackProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user);
  }, [fetchProfile, user]);

  const signOut = useCallback(async () => {
    // Supabase owns the auth cookies. Do not manually delete refresh-token storage,
    // because doing so can leave different tabs with stale/invalid tokens.
    await Promise.allSettled([
      withTimeout(supabase.auth.signOut({ scope: 'local' }), 6000),
      withTimeout(
        fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        }),
        6000
      ),
    ]);

    activeUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setProfile(null);
    setServerIsAdmin(false);
    setServerCanAccessAdmin(false);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession());
        if (!mountedRef.current) return;

        if (!error && data.session) {
          applySession(data.session);
        } else if (!initialUser) {
          // Confirm with the server before treating a missing browser session as logged out.
          await fetchServerIdentity();
        }
      } catch {
        if (!initialUser) await fetchServerIdentity();
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    void initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Keep this callback synchronous. Supabase recommends avoiding awaited work here.
      if (event === 'SIGNED_OUT') {
        applySession(null);
        setIsLoading(false);
        return;
      }

      if (nextSession) {
        applySession(nextSession);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession, fetchServerIdentity, initialUser, supabase]);

  const isAdmin = Boolean(user && (profile?.role === 'admin' || serverIsAdmin));
  const canAccessAdmin = Boolean(
    user && (
      isAdmin ||
      profile?.role === 'seller' ||
      profile?.role === 'warehouse' ||
      serverCanAccessAdmin
    )
  );

  const value = useMemo(() => ({
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    canAccessAdmin,
    signOut,
    refreshProfile,
  }), [canAccessAdmin, isAdmin, isLoading, profile, refreshProfile, session, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
