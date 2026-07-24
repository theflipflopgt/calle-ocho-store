'use client';

import { useEffect } from 'react';
import { ProductCard } from './product-card';
import { useCart } from '@/contexts/cart-context';
import { useWishlistContext } from '@/contexts/wishlist-context';
import type { ProductWithDetails } from '@/types/product';
import { trackViewItemList } from '@/lib/analytics';

interface ProductGridProps {
  products: ProductWithDetails[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = 'No se encontraron productos' }: ProductGridProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistContext();

  useEffect(() => {
    trackViewItemList(
      products.map((product, index) => ({
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand.name,
        item_category: product.category.name,
        price: Number(product.lowestPrice || product.base_price),
        index,
      })),
      'Catálogo de productos'
    );
  }, [products]);

  const handleQuickAdd = async (variantId: string) => {
    await addItem(variantId, 1);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <p className="text-gray-500 text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickAdd={handleQuickAdd}
          onAddToWishlist={toggleWishlist}
          isInWishlist={isInWishlist(product.id)}
        />
      ))}
    </div>
  );
}
