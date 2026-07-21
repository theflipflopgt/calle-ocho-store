'use client';

import { ProductCard } from './product-card';
import { useCart } from '@/contexts/cart-context';
import type { ProductWithDetails } from '@/types/product';

interface ProductGridProps {
  products: ProductWithDetails[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = 'No se encontraron productos' }: ProductGridProps) {
  const { addItem } = useCart();

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
        />
      ))}
    </div>
  );
}
