'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency';
import type { ProductWithDetails } from '@/types/product';

interface NewArrivalsSliderProps {
  products: ProductWithDetails[];
}

/**
 * Slider horizontal de nuevos lanzamientos
 * Inspirado en el carousel de Kicks pero mejorado
 */
export function NewArrivalsSlider({ products }: NewArrivalsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newPosition =
        direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12 lg:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-black mb-2">
              Nuevos Lanzamientos
            </h2>
            <p className="text-gray-600 text-sm lg:text-base">
              Lo último en sneakers y tendencias
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link href="/hombre">
              <Button variant="link" className="text-brand-blue font-medium">
                Ver todo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Productos Slider */}
        <div
          ref={scrollRef}
          className="flex gap-4 lg:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {products.map((product) => {
            const mainImage = product.colors[0]?.images[0]?.image_url;

            return (
              <Link
                key={product.id}
                href={`/producto/${product.slug}`}
                className="group flex h-full flex-shrink-0 w-[240px] lg:w-[272px] snap-start"
              >
                <div className="flex h-full w-full flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Imagen */}
                  <div className="relative w-full aspect-square bg-gray-100">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 240px, 272px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isNew && (
                        <Badge className="bg-brand-blue text-white text-xs">
                          NUEVO
                        </Badge>
                      )}
                      {product.hasDiscount && (
                        <Badge className="bg-brand-red text-white text-xs">
                          -{product.discountPercentage}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex min-h-[126px] flex-1 flex-col p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {product.brand.name}
                    </p>
                    <h3 className="min-h-10 font-semibold text-sm leading-5 text-brand-black mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-auto flex items-baseline gap-2">
                      <span className="text-lg font-bold text-brand-black">
                        {formatPrice(product.lowestPrice)}
                      </span>
                      {product.hasDiscount && product.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
