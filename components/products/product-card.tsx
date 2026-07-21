'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import type { ProductCardProps } from '@/types/product';

export function ProductCard({
  product,
  onAddToWishlist,
  onQuickAdd,
  isInWishlist = false,
}: ProductCardProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const selectedColor = product.colors[selectedColorIndex];
  const mainImage = selectedColor?.images?.[0]?.image_url;
  const hoverImage = selectedColor?.images?.[1]?.image_url;
  const availableVariants = selectedColor?.variants?.filter(v => v.is_available && v.stock_quantity > 0) || [];

  const handleQuickAdd = useCallback((variantId: string) => {
    onQuickAdd?.(variantId);
    setShowSizeSelector(false);
  }, [onQuickAdd]);

  // Toggle size selector on mobile tap
  const handleMobileQuickAdd = useCallback(() => {
    setShowSizeSelector(prev => !prev);
  }, []);

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden touch-manipulation shadow-sm hover:shadow-md dark:hover:shadow-gray-700/50 transition-all hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizeSelector(false);
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Link href={`/producto/${product.slug}`}>
          {mainImage ? (
            <>
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  isHovered && hoverImage ? "opacity-0" : "opacity-100"
                )}
              />
              {hoverImage && (
                <Image
                  src={hoverImage}
                  alt={`${product.name} - vista 2`}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-10">
          {product.isNew && (
            <Badge className="bg-brand-blue text-white font-semibold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              Nuevo
            </Badge>
          )}
          {product.hasDiscount && product.discountPercentage && (
            <Badge className="bg-brand-red text-white font-semibold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              -{product.discountPercentage}%
            </Badge>
          )}
          {product.isLowStock && product.totalStock > 0 && (
            <Badge variant="outline" className="bg-white/90 text-brand-orange border-brand-orange font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              ¡Últimas unidades!
            </Badge>
          )}
          {product.totalStock === 0 && (
            <Badge variant="outline" className="bg-white/90 text-gray-500 border-gray-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              Agotado
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-white/80 hover:bg-white transition-all w-8 h-8 sm:w-9 sm:h-9",
            isInWishlist ? "text-brand-red" : "text-gray-600 hover:text-brand-red"
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAddToWishlist?.(product.id);
          }}
          aria-label={isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isInWishlist && "fill-current")} />
        </Button>

        {/* Quick Actions - Desktop: Hover, Mobile: Always visible button */}
        {/* Desktop hover overlay */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300",
          "hidden md:block",
          isHovered ? "md:opacity-100" : "md:opacity-0"
        )}>
          {!showSizeSelector ? (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-white text-brand-black hover:bg-gray-100 font-semibold"
                size="sm"
                onClick={() => setShowSizeSelector(true)}
                disabled={product.totalStock === 0}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Agregar rápido
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/90 hover:bg-white"
                asChild
              >
                <Link href={`/producto/${product.slug}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2 font-medium">Selecciona tu talla</p>
              <div className="flex flex-wrap gap-1">
                {availableVariants.map((variant) => (
                  <button
                    key={variant.id}
                    className={cn(
                      "px-2 py-1 text-xs border rounded font-medium transition-colors",
                      variant.stock_quantity <= (variant.low_stock_threshold || 3)
                        ? "border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white"
                        : "border-gray-300 hover:border-brand-black hover:bg-brand-black hover:text-white"
                    )}
                    onClick={() => handleQuickAdd(variant.id)}
                  >
                    {variant.size_us}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Quick add button always visible */}
        <Button
          size="icon"
          className={cn(
            "absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 md:hidden",
            "bg-brand-black text-white shadow-lg",
            "w-9 h-9 sm:w-10 sm:h-10 rounded-full",
            product.totalStock === 0 && "opacity-50"
          )}
          onClick={handleMobileQuickAdd}
          disabled={product.totalStock === 0}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* Mobile size selector popup */}
        {showSizeSelector && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-3 sm:p-4 shadow-lg z-20 md:hidden animate-in slide-in-from-bottom duration-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Selecciona tu talla</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableVariants.map((variant) => (
                <button
                  key={variant.id}
                  className={cn(
                    "min-w-[40px] sm:min-w-[44px] h-10 sm:h-11 px-2.5 sm:px-3 text-xs sm:text-sm border rounded-lg font-medium transition-colors",
                    "active:scale-95",
                    variant.stock_quantity <= (variant.low_stock_threshold || 3)
                      ? "border-brand-orange text-brand-orange active:bg-brand-orange active:text-white"
                      : "border-gray-300 active:border-brand-black active:bg-brand-black active:text-white"
                  )}
                  onClick={() => handleQuickAdd(variant.id)}
                >
                  {variant.size_us}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        {/* Color Selector */}
        {product.colors.length > 1 && (
          <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {product.colors.map((color, index) => (
              <button
                key={color.id}
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all touch-manipulation",
                  index === selectedColorIndex
                    ? "border-brand-black scale-110"
                    : "border-gray-300"
                )}
                style={{ backgroundColor: color.color_code || '#ccc' }}
                onClick={() => setSelectedColorIndex(index)}
                aria-label={color.color_name}
              />
            ))}
          </div>
        )}

        {/* Brand */}
        <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">
          {product.brand.name}
        </p>

        {/* Name */}
        <Link href={`/producto/${product.slug}`}>
          <h3 className="font-medium text-sm sm:text-base text-brand-black line-clamp-2 mb-1 sm:mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm sm:text-base text-brand-black">
            {formatPrice(product.lowestPrice)}
          </span>
          {product.hasDiscount && product.compare_at_price && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
