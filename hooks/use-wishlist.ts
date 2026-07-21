'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string | null;
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Check auth and load wishlist
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user) {
        const { data } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', user.id);
        setItems(data || []);
      } else {
        // Load from localStorage for guests
        const stored = localStorage.getItem('wishlist');
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

  const toggleWishlist = useCallback(async (productId: string) => {
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
        const { data } = await supabase
          .from('wishlists')
          .insert({ user_id: userId, product_id: productId })
          .select()
          .single();
        if (data) {
          setItems(prev => [...prev, data]);
        }
      }
    } else {
      // Guest user - use localStorage
      if (exists) {
        const newItems = items.filter(item => item.product_id !== productId);
        setItems(newItems);
        localStorage.setItem('wishlist', JSON.stringify(newItems));
      } else {
        const newItem: WishlistItem = {
          id: crypto.randomUUID(),
          product_id: productId,
          created_at: new Date().toISOString()
        };
        const newItems = [...items, newItem];
        setItems(newItems);
        localStorage.setItem('wishlist', JSON.stringify(newItems));
      }
    }
  }, [userId, items, isInWishlist, supabase]);

  const clearWishlist = useCallback(async () => {
    if (userId) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);
    } else {
      localStorage.removeItem('wishlist');
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
