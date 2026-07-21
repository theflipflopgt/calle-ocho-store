'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProductWithDetails } from '@/types/product';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string | null;
  productSnapshot?: ProductWithDetails;
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const GUEST_WISHLIST_KEY = 'wishlist';

  const addLocalWishlistItem = useCallback((productId: string, productSnapshot?: ProductWithDetails) => {
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      product_id: productId,
      created_at: new Date().toISOString(),
      productSnapshot,
    };

    setItems(prev => {
      if (prev.some(item => item.product_id === productId)) return prev;
      return [...prev, newItem];
    });

    return newItem;
  }, []);

  // Check auth and load wishlist
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user) {
        const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
        const guestItems: WishlistItem[] = stored ? JSON.parse(stored) : [];

        if (guestItems.length > 0) {
          const guestProductIds = Array.from(
            new Set(guestItems.map((item) => item.product_id))
          );

          const { data: existingItems } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', user.id)
            .in('product_id', guestProductIds);

          const existingProductIds = new Set(
            (existingItems || []).map((item) => item.product_id)
          );

          const rows = guestProductIds
            .filter((productId) => !existingProductIds.has(productId))
            .map((productId) => ({
              user_id: user.id,
              product_id: productId,
            }));

          if (rows.length > 0) {
            await supabase.from('wishlists').insert(rows);
          }

          localStorage.removeItem(GUEST_WISHLIST_KEY);
        }

        const { data } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', user.id);
        setItems(data || []);
      } else {
        // Load from localStorage for guests
        const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [supabase]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.product_id === productId);
  }, [items]);

  const toggleWishlist = useCallback(async (productId: string, productSnapshot?: ProductWithDetails) => {
    const exists = isInWishlist(productId);

    if (userId) {
      // Authenticated user - use Supabase
      if (exists) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        setItems(prev => prev.filter(item => item.product_id !== productId));
      } else {
        const fallbackItem = addLocalWishlistItem(productId, productSnapshot);
        const { data, error } = await supabase
          .from('wishlists')
          .insert({ user_id: userId, product_id: productId })
          .select()
          .single();

        if (error) {
          console.error('Error adding wishlist item:', error);
          const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
          const guestItems: WishlistItem[] = stored ? JSON.parse(stored) : [];
          if (!guestItems.some(item => item.product_id === productId)) {
            localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify([...guestItems, fallbackItem]));
          }
          return;
        }

        if (data) {
          setItems(prev => prev.map(item => item.product_id === productId ? data : item));
        }
      }
    } else {
      // Guest user - use localStorage
      if (exists) {
        const newItems = items.filter(item => item.product_id !== productId);
        setItems(newItems);
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(newItems));
      } else {
        const newItem = addLocalWishlistItem(productId, productSnapshot);
        const newItems = [...items, newItem];
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(newItems));
      }
    }
  }, [userId, items, isInWishlist, supabase, addLocalWishlistItem]);

  const clearWishlist = useCallback(async () => {
    if (userId) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);
    } else {
      localStorage.removeItem(GUEST_WISHLIST_KEY);
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
