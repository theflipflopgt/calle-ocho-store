'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './product-card';
import type { ProductWithDetails } from '@/types/product';

interface NewArrivalsSectionProps {
  products: ProductWithDetails[];
  onAddToWishlist?: (productId: string) => void;
  onQuickAdd?: (variantId: string) => void;
  wishlistIds?: string[];
}

export function NewArrivalsSection({
  products,
  onAddToWishlist,
  onQuickAdd,
  wishlistIds = []
}: NewArrivalsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-black">
            Nuevos Arrivals
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => scroll('left')}
              className="hidden md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => scroll('right')}
              className="hidden md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="link" className="text-brand-blue font-medium" asChild>
              <a href="/nuevos">Ver todos →</a>
            </Button>
          </div>
        </div>

        {/* Products Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex h-auto flex-shrink-0 w-[280px] snap-start">
              <ProductCard
                product={product}
                onAddToWishlist={onAddToWishlist}
                onQuickAdd={onQuickAdd}
                isInWishlist={wishlistIds.includes(product.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
