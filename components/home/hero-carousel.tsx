'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import type { ProductWithDetails } from '@/types/product';

interface HeroCarouselProps {
  products: ProductWithDetails[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const visibleProducts = products.slice(0, 5);

  const nextSlide = useCallback(() => {
    setDirection('right');
    setCurrentIndex((prev) => (prev + 1) % visibleProducts.length);
  }, [visibleProducts.length]);

  const prevSlide = useCallback(() => {
    setDirection('left');
    setCurrentIndex((prev) => (prev - 1 + visibleProducts.length) % visibleProducts.length);
  }, [visibleProducts.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  if (visibleProducts.length === 0) {
    return null;
  }

  const currentProduct = visibleProducts[currentIndex];
  const mainImage = currentProduct.colors[0]?.images?.[0]?.image_url;

  // Get background gradient based on product
  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-600/20 to-purple-600/20',
      'from-red-600/20 to-orange-600/20',
      'from-green-600/20 to-teal-600/20',
      'from-purple-600/20 to-pink-600/20',
      'from-orange-600/20 to-yellow-600/20',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <section className="relative h-[calc(100vh-4rem)] max-h-[700px] sm:max-h-[750px] lg:max-h-[800px] bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-all duration-1000",
          getGradient(currentIndex)
        )}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      <div className="container mx-auto px-4 h-full relative z-10">
        {/* Mobile: Stack image on top, content below */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-12 items-center h-full py-4 lg:py-12">
          {/* Product Image - Order first on mobile, second on desktop */}
          <div className="relative w-full h-1/2 lg:h-full lg:order-2 flex items-center justify-center">
            <div
              className={cn(
                "relative w-full h-full max-w-md lg:max-w-none transition-all duration-700 transform",
                direction === 'right' ? 'animate-in slide-in-from-right-10' : 'animate-in slide-in-from-left-10'
              )}
            >
              {mainImage ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={mainImage}
                    alt={currentProduct.name}
                    fill
                    className="object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3"
                    priority
                  />
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent blur-3xl -z-10 group-hover:from-white/30 transition-all duration-500" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-lg backdrop-blur-sm">
                  <span className="text-white/50 text-xl">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Floating Elements */}
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 text-white text-xs font-medium border border-white/20">
              {currentProduct.totalStock > 0 ? `${currentProduct.totalStock} disponibles` : 'Agotado'}
            </div>
          </div>

          {/* Product Info - Order second on mobile, first on desktop */}
          <div className="flex flex-col justify-center space-y-3 lg:space-y-6 h-1/2 lg:h-full lg:order-1">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {currentProduct.isNew && (
                <Badge className="bg-brand-blue text-white px-2 py-0.5 text-xs font-semibold">
                  NUEVO
                </Badge>
              )}
              {currentProduct.hasDiscount && (
                <Badge className="bg-brand-red text-white px-2 py-0.5 text-xs font-semibold">
                  -{currentProduct.discountPercentage}% OFF
                </Badge>
              )}
              {currentProduct.isLowStock && (
                <Badge className="bg-brand-orange text-white px-2 py-0.5 text-xs font-semibold">
                  ÚLTIMAS UNIDADES
                </Badge>
              )}
            </div>

            {/* Brand & Product Name */}
            <div className="space-y-1">
              <p className="text-white/70 text-xs sm:text-sm uppercase tracking-wider font-medium">
                {currentProduct.brand.name}
              </p>
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight">
                {currentProduct.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                {formatPrice(currentProduct.lowestPrice)}
              </span>
              {currentProduct.hasDiscount && currentProduct.compare_at_price && (
                <span className="text-lg sm:text-xl text-white/50 line-through">
                  {formatPrice(currentProduct.compare_at_price)}
                </span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                size="sm"
                className="bg-white text-brand-black hover:bg-gray-100 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-6 font-semibold lg:text-lg lg:h-14 lg:px-8"
                asChild
              >
                <Link href={`/producto/${currentProduct.slug}`}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Comprar Ahora
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-brand-black text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-6 font-semibold lg:text-lg lg:h-14 lg:px-8"
                asChild
              >
                <Link href={`/producto/${currentProduct.slug}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalles
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Arrow Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 w-12 h-12"
                onClick={() => {
                  prevSlide();
                  setIsAutoPlaying(false);
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 w-12 h-12"
                onClick={() => {
                  nextSlide();
                  setIsAutoPlaying(false);
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Dot Indicators */}
            <div className="flex gap-2">
              {visibleProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="text-white/70 text-sm font-medium min-w-[60px] text-right">
              {currentIndex + 1} / {visibleProducts.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
