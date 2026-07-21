'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight, Check, Truck, RotateCcw, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/cart-context';
import type { ProductWithDetails } from '@/types/product';

interface ProductDetailProps {
  product: ProductWithDetails;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addItem } = useCart();

  const selectedColor = product.colors[selectedColorIndex];
  const images = selectedColor?.images || [];
  const variants = selectedColor?.variants || [];

  const availableVariants = useMemo(() =>
    variants.filter(v => v.is_available && v.stock_quantity > 0),
    [variants]
  );

  const selectedVariant = useMemo(() =>
    variants.find(v => v.id === selectedVariantId),
    [variants, selectedVariantId]
  );

  const maxQuantity = selectedVariant?.stock_quantity || 1;

  // Reset image and variant when color changes
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setCurrentImageIndex(0);
    setSelectedVariantId(null);
    setQuantity(1);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      for (let i = 0; i < quantity; i++) {
        await addItem(selectedVariantId, 1);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-16">
      {/* Image Gallery */}
      <div className="space-y-3 sm:space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden">
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImageIndex]?.image_url || ''}
                alt={`${product.name} - Imagen ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                priority
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}

              {/* Image Counter - Mobile */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full sm:hidden">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge className="bg-brand-blue text-white font-semibold text-xs">
                Nuevo
              </Badge>
            )}
            {product.hasDiscount && product.discountPercentage && (
              <Badge className="bg-brand-red text-white font-semibold text-xs">
                -{product.discountPercentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* Thumbnails - Desktop */}
        {images.length > 1 && (
          <div className="hidden sm:flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                  currentImageIndex === index
                    ? "border-brand-black"
                    : "border-transparent hover:border-gray-300"
                )}
              >
                <Image
                  src={image.image_url}
                  alt={`${product.name} - Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Thumbnail Dots - Mobile */}
        {images.length > 1 && (
          <div className="flex sm:hidden justify-center gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentImageIndex === index
                    ? "bg-brand-black w-4"
                    : "bg-gray-300"
                )}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4 sm:space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 overflow-x-auto">
          <Link href="/" className="hover:text-brand-black whitespace-nowrap">Inicio</Link>
          <span>/</span>
          <Link href={`/marcas/${product.brand.slug}`} className="hover:text-brand-black whitespace-nowrap">
            {product.brand.name}
          </Link>
          <span>/</span>
          <span className="text-brand-black truncate">{product.name}</span>
        </nav>

        {/* Brand */}
        <Link
          href={`/marcas/${product.brand.slug}`}
          className="inline-block text-xs sm:text-sm text-gray-500 uppercase tracking-wide hover:text-brand-black"
        >
          {product.brand.name}
        </Link>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-black leading-tight">
          {product.name}
        </h1>

        {/* Price */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-brand-black">
            {formatPrice(product.lowestPrice)}
          </span>
          {product.hasDiscount && product.compare_at_price && (
            <>
              <span className="text-lg sm:text-xl text-gray-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
              <Badge className="bg-brand-red text-white text-xs sm:text-sm">
                Ahorras {formatPrice(product.compare_at_price - product.lowestPrice)}
              </Badge>
            </>
          )}
        </div>

        {/* Stock Status */}
        {product.totalStock > 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">En stock</span>
            {product.isLowStock && (
              <span className="text-brand-orange">• Pocas unidades</span>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 font-medium">Agotado</div>
        )}

        {/* Color Selector */}
        {product.colors.length > 1 && (
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm font-medium text-brand-black">
              Color: <span className="font-normal text-gray-600">{selectedColor?.color_name}</span>
            </p>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {product.colors.map((color, index) => (
                <button
                  key={color.id}
                  onClick={() => handleColorChange(index)}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all relative",
                    index === selectedColorIndex
                      ? "border-brand-black scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color.color_code || '#ccc' }}
                  aria-label={color.color_name}
                >
                  {index === selectedColorIndex && (
                    <Check className={cn(
                      "absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5",
                      color.color_code && isLightColor(color.color_code) ? "text-black" : "text-white"
                    )} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selector */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-brand-black">
              Talla: <span className="font-normal text-gray-600">{selectedVariant?.size_us || 'Selecciona una talla'}</span>
            </p>
            <Link href="/guia-de-tallas" className="text-base font-semibold text-brand-blue hover:underline">
              Guía de tallas
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isAvailable = variant.is_available && variant.stock_quantity > 0;
              const isLowStock = isAvailable && variant.stock_quantity <= (variant.low_stock_threshold || 3);
              const isSelected = variant.id === selectedVariantId;

              return (
                <button
                  key={variant.id}
                  onClick={() => isAvailable && setSelectedVariantId(variant.id)}
                  disabled={!isAvailable}
                  className={cn(
                    "min-w-[48px] sm:min-w-[56px] h-10 sm:h-12 px-3 sm:px-4 text-sm sm:text-base font-medium rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-brand-black bg-brand-black text-white"
                      : isAvailable
                        ? isLowStock
                          ? "border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                          : "border-gray-200 hover:border-brand-black"
                        : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                  )}
                >
                  {variant.size_us}
                </button>
              );
            })}
          </div>
          {availableVariants.length === 0 && (
            <p className="text-sm text-gray-500">No hay tallas disponibles en este color</p>
          )}
        </div>

        {/* Quantity Selector */}
        {selectedVariantId && (
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm font-medium text-brand-black">Cantidad</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 sm:w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {maxQuantity} disponible{maxQuantity !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            size="lg"
            className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-brand-black hover:bg-gray-800"
            onClick={handleAddToCart}
            disabled={!selectedVariantId || product.totalStock === 0 || isAddingToCart}
          >
            {isAddingToCart ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5 mr-2" />
            )}
            {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 sm:h-14 w-12 sm:w-14 border-gray-200"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="w-5 h-5 text-brand-blue flex-shrink-0" />
            <span className="text-gray-600">Envío a todo Guatemala</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RotateCcw className="w-5 h-5 text-brand-blue flex-shrink-0" />
            <span className="text-gray-600">Cambios y devoluciones</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="w-5 h-5 text-brand-blue flex-shrink-0" />
            <span className="text-gray-600">100% Originales</span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="pt-4 sm:pt-6 border-t border-gray-100">
            <h3 className="text-sm sm:text-base font-semibold text-brand-black mb-2 sm:mb-3">
              Descripción
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Category Link */}
        <div className="pt-4 border-t border-gray-100">
          <Link
            href={`/marcas/${product.brand.slug}`}
            className="inline-flex items-center gap-2 text-sm text-brand-blue hover:underline"
          >
            Ver más productos de {product.brand.name}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine if a color is light
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
