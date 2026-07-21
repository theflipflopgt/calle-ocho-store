'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWishlist } from '@/hooks/use-wishlist';
import type { ProductWithDetails } from '@/types/product';

interface WishlistContextType {
  items: { id: string; product_id: string; created_at: string | null; productSnapshot?: ProductWithDetails }[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, productSnapshot?: ProductWithDetails) => Promise<void>;
  clearWishlist: () => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlist = useWishlist();

  return (
    <WishlistContext.Provider value={wishlist}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
}
