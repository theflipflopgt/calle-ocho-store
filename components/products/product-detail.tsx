'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight, Check, Truck, RotateCcw, Shield, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/cart-context';
import { useWishlistContext } from '@/contexts/wishlist-context';
import type { ProductWithDetails } from '@/types/product';
import { trackAddToCart, trackViewItem } from '@/lib/analytics';
import { sortAndLimitProductImages } from '@/lib/products/product-images';

interface ProductDetailProps {
  product: ProductWithDetails;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistContext();

  const selectedColor = product.colors[selectedColorIndex];
  const images = useMemo(
    () =>
      sortAndLimitProductImages(selectedColor?.images || []),
    [selectedColor]
  );
  const variants = useMemo(() => selectedColor?.variants || [], [selectedColor]);

  const availableVariants = useMemo(() =>
    variants.filter(v => v.is_available && v.stock_quantity > 0),
    [variants]
  );

  const selectedVariant = useMemo(() =>
    variants.find(v => v.id === selectedVariantId),
    [variants, selectedVariantId]
  );

  const maxQuantity = selectedVariant?.stock_quantity || 1;
  const displayPrice = Number(selectedVariant?.price_override ?? product.lowestPrice);
  const hasDisplayDiscount = Boolean(
    product.compare_at_price && product.compare_at_price > displayPrice
  );

  useEffect(() => {
    trackViewItem({
      item_id: product.id,
      item_name: product.name,
      item_brand: product.brand.name,
      item_category: product.category.name,
      price: Number(product.lowestPrice || product.base_price),
      quantity: 1,
    });
  }, [product]);

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

  const handleGalleryTouchEnd = (endX: number) => {
    if (touchStartX.current === null || images.length < 2) return;
    const distance = touchStartX.current - endX;
    touchStartX.current = null;

    if (Math.abs(distance) < 50) return;
    if (distance > 0) handleNextImage();
    else handlePrevImage();
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      let added = true;
      for (let i = 0; i < quantity; i++) {
        const result = await addItem(selectedVariantId, 1);
        added = added && result;
      }

      if (added && selectedVariant) {
        trackAddToCart({
          item_id: selectedVariant.id,
          item_name: product.name,
          item_brand: product.brand.name,
          item_category: product.category.name,
          item_variant: `${selectedColor?.color_name || ''} / US ${selectedVariant.size_us}`,
          price: Number(selectedVariant.price_override ?? product.base_price),
          quantity,
        });
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-16">
      {/* Image Gallery */}
      <div className="space-y-3">
        <div className="flex gap-3 sm:gap-4">
          {/* Miniaturas verticales en escritorio */}
          {images.length > 1 && (
            <div className="hidden sm:flex w-16 md:w-20 flex-col gap-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-md border transition-colors',
                    currentImageIndex === index
                      ? 'border-brand-black'
                      : 'border-gray-200 hover:border-gray-400'
                  )}
                  aria-label={`Mostrar imagen ${index + 1} de ${images.length}`}
                >
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || `${product.name} - Miniatura ${index + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Imagen principal */}
          <div
            className="relative min-w-0 flex-1 aspect-square overflow-hidden rounded-lg border border-gray-100 bg-white sm:rounded-xl"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              handleGalleryTouchEnd(event.changedTouches[0]?.clientX ?? 0);
            }}
          >
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]?.image_url || ''}
                  alt={images[currentImageIndex]?.alt_text || `${product.name} - Imagen ${currentImageIndex + 1}`}
                  fill
                  className="object-contain p-3 sm:p-5"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-md transition-colors hover:bg-gray-800 sm:left-3 sm:h-10 sm:w-10"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-md transition-colors hover:bg-gray-800 sm:right-3 sm:h-10 sm:w-10"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white sm:hidden">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {product.isNew && (
                <Badge className="bg-brand-blue text-xs font-semibold text-white">
                  Nuevo
                </Badge>
              )}
              {product.hasDiscount && product.discountPercentage && (
                <Badge className="bg-brand-red text-xs font-semibold text-white">
                  -{product.discountPercentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Indicadores tactiles en telefonos */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 sm:hidden">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  currentImageIndex === index ? 'w-4 bg-brand-black' : 'w-2 bg-gray-300'
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
            {formatPrice(displayPrice)}
          </span>
          {hasDisplayDiscount && product.compare_at_price && (
            <>
              <span className="text-lg sm:text-xl text-gray-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
              <Badge className="bg-brand-red text-white text-xs sm:text-sm">
                Ahorras {formatPrice(product.compare_at_price - displayPrice)}
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
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="text-base font-semibold text-brand-blue hover:underline"
            >
              Guía de tallas
            </button>
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
            className={cn(
              "h-12 sm:h-14 w-12 sm:w-14 border-gray-200",
              isInWishlist(product.id) && "border-brand-red text-brand-red"
            )}
            onClick={() => toggleWishlist(product.id)}
            aria-label="Agregar a favoritos"
          >
            <Heart className={cn("w-5 h-5", isInWishlist(product.id) && "fill-current")} />
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
      {isSizeGuideOpen && <SizeGuideModal onClose={() => setIsSizeGuideOpen(false)} />}
    </div>
  );
}

const sizeGuideTables = [
  {
    title: 'Dama',
    rows: [
      ['22', '5', '-'],
      ['22.5', '5.5', '35'],
      ['23', '6', '36'],
      ['23.5', '6.5', '36/37'],
      ['24', '7', '37'],
      ['24.5', '7.5', '38'],
      ['25', '8', '38.5'],
      ['25.5', '8.5', '39'],
      ['26', '9', '39.5'],
      ['26.5', '9.5', '40.5'],
      ['27', '10', '41'],
    ],
  },
  {
    title: 'Caballero',
    rows: [
      ['25', '7', '40'],
      ['25.5', '7.5', '40.5'],
      ['26', '8', '41'],
      ['26.5', '8.5', '41.5'],
      ['27', '9', '42'],
      ['27.5', '9.5', '42.5'],
      ['28', '10', '43'],
      ['28.5', '10.5', '44'],
      ['29', '11', '44.5'],
      ['29.5', '11.5', '45'],
      ['30', '12', '46'],
      ['31', '13', '46.5'],
    ],
  },
  {
    title: 'Niños',
    rows: [
      ['14.5', '8.5', '26'],
      ['16.5', '11.5', '29'],
      ['17', '12', '29.7'],
      ['18', '13', '31'],
      ['19', '1', '33'],
      ['20', '2', '34'],
      ['21', '3', '35'],
      ['22', '4', '36'],
      ['22.5', '4.5', '37'],
      ['23', '5', '37.5'],
    ],
  },
];

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[85vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-lg font-bold text-brand-black">Guía de tallas</h2>
            <p className="text-xs text-gray-500">Consulta sin salir del producto.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-black"
            aria-label="Cerrar guía de tallas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-72px)] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-4 md:grid-cols-3">
            {sizeGuideTables.map((table) => (
              <div key={table.title} className="overflow-hidden rounded-lg border border-gray-200">
                <h3 className="bg-brand-black px-3 py-2 text-sm font-semibold text-white">
                  {table.title}
                </h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">México</th>
                      <th className="px-3 py-2 text-left">USA</th>
                      <th className="px-3 py-2 text-left">Europa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {table.rows.map((row) => (
                      <tr key={`${table.title}-${row.join('-')}`}>
                        {row.map((cell) => (
                          <td key={cell} className="px-3 py-2 font-medium text-gray-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Si estás entre dos tallas, escríbenos por WhatsApp y te ayudamos a elegir antes de comprar.
          </p>
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
