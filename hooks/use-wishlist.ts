'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string | null;
}

const LOCAL_WISHLIST_KEY = 'wishlist';

function readLocalWishlist(): WishlistItem[] {
  const stored = localStorage.getItem(LOCAL_WISHLIST_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(LOCAL_WISHLIST_KEY);
    return [];
  }
}

function writeLocalWishlist(items: WishlistItem[]) {
  localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Check auth and load wishlist
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        setUserId(user?.id || null);

        if (user) {
          const { data, error } = await supabase
            .from('wishlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!isMounted) return;
          setItems(error ? readLocalWishlist() : data || readLocalWishlist());
        } else {
          // Load from localStorage for guests
          setItems(readLocalWishlist());
        }
      } catch {
        if (isMounted) {
          setItems(readLocalWishlist());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.product_id === productId);
  }, [items]);

  const toggleWishlist = useCallback(async (productId: string) => {
    const exists = isInWishlist(productId);

    if (userId) {
      // Authenticated user - use Supabase
      if (exists) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        if (error) {
          const newItems = items.filter(item => item.product_id !== productId);
          setItems(newItems);
          writeLocalWishlist(newItems);
          return;
        }
        setItems(prev => prev.filter(item => item.product_id !== productId));
      } else {
        const { data, error } = await supabase
          .from('wishlists')
          .insert({ user_id: userId, product_id: productId })
          .select()
          .single();
        if (!error && data) {
          setItems(prev => [...prev, data]);
        } else {
          const newItem: WishlistItem = {
            id: crypto.randomUUID(),
            product_id: productId,
            created_at: new Date().toISOString(),
          };
          const newItems = [...items, newItem];
          setItems(newItems);
          writeLocalWishlist(newItems);
        }
      }
    } else {
      // Guest user - use localStorage
      if (exists) {
        const newItems = items.filter(item => item.product_id !== productId);
        setItems(newItems);
        writeLocalWishlist(newItems);
      } else {
        const newItem: WishlistItem = {
          id: crypto.randomUUID(),
          product_id: productId,
          created_at: new Date().toISOString()
        };
        const newItems = [...items, newItem];
        setItems(newItems);
        writeLocalWishlist(newItems);
      }
    }
  }, [userId, items, isInWishlist, supabase]);

  const clearWishlist = useCallback(async () => {
    if (userId) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);
      if (error) {
        localStorage.removeItem(LOCAL_WISHLIST_KEY);
      }
    } else {
      localStorage.removeItem(LOCAL_WISHLIST_KEY);
    }
    setItems([]);
  }, [userId, supabase]);

  return {
    items,
    loading,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    count: items.length
  };
}
