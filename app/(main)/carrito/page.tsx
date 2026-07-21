'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { formatPrice } from '@/lib/utils/currency';

export default function CartPage() {
  const {
    items,
    isLoading,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-md mx-auto text-center py-12 sm:py-20">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-black mb-3">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-500 mb-8">
            Parece que aún no has agregado productos a tu carrito.
            ¡Explora nuestra colección!
          </p>
          <Button size="lg" asChild>
            <Link href="/hombre">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Explorar productos
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-black">
            Tu Carrito
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {itemCount} producto{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={clearCart}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Vaciar carrito</span>
          <span className="sm:hidden">Vaciar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}

          {/* Continue Shopping */}
          <Link
            href="/hombre"
            className="inline-flex items-center gap-2 text-sm text-brand-blue hover:underline mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar comprando
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 sm:p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-brand-black mb-4">
              Resumen del pedido
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({itemCount} productos)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-500">Calculado en checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4 pt-4">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-brand-black">Total</span>
                <span className="text-xl font-bold text-brand-black">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12 sm:h-14 text-base font-semibold bg-brand-black hover:bg-gray-800"
              asChild
            >
              <Link href="/checkout">
                Proceder al checkout
              </Link>
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Pedido manual: pago contra entrega o transferencia bancaria
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

interface CartItemCardProps {
  item: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      size_us: number;
      size_eu: number;
      stock_quantity: number;
      product_color: {
        color_name: string;
        images: { image_url: string }[];
        product: {
          name: string;
          slug: string;
          base_price: number;
          compare_at_price: number | null;
          brand: { name: string };
        };
      };
    };
  };
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { variant } = item;
  const { product_color } = variant;
  const { product } = product_color;
  const image = product_color.images[0]?.image_url;
  const maxQuantity = variant.stock_quantity;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;

  return (
    <div className="flex gap-4 sm:gap-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
      {/* Image */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Sin imagen
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {product.brand.name}
          </p>
          <Link
            href={`/producto/${product.slug}`}
            className="text-base sm:text-lg font-medium text-brand-black hover:underline line-clamp-2 mt-0.5"
          >
            {product.name}
          </Link>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 sm:mt-2 text-sm text-gray-500">
            <span>Color: {product_color.color_name}</span>
            <span>Talla US: {variant.size_us}</span>
            <span className="hidden sm:inline">Talla EU: {variant.size_eu}</span>
          </div>
        </div>

        {/* Price, Quantity & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-3 sm:mt-4">
          {/* Quantity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 sm:w-12 text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= maxQuantity}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Eliminar"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg sm:text-xl font-bold text-brand-black">
              {formatPrice(product.base_price * item.quantity)}
            </p>
            {(item.quantity > 1 || hasDiscount) && (
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <span className="text-sm text-gray-500">
                  {formatPrice(product.base_price)} c/u
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.compare_at_price!)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
