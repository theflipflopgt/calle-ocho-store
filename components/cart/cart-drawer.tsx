'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const {
    items,
    isLoading,
    isOpen,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
    closeCart,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] md:w-[450px] bg-white shadow-2xl flex flex-col"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-black" />
            <h2 className="text-lg font-semibold text-brand-black">
              Tu Carrito
            </h2>
            {itemCount > 0 && (
              <span className="bg-brand-black text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-brand-black mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Explora nuestra colección y encuentra tus tenis favoritos
              </p>
              <Button onClick={closeCart} asChild>
                <Link href="/hombre">
                  Ver productos
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 sm:px-6 py-4 sm:py-6 space-y-4 bg-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-semibold text-brand-black">
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              Envío y cupones se calculan en el checkout
            </p>

            {/* Actions */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-brand-black hover:bg-gray-800"
                onClick={closeCart}
                asChild
              >
                <Link href="/checkout">
                  Ir al Checkout
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 text-sm"
                onClick={closeCart}
                asChild
              >
                <Link href="/carrito">
                  Ver carrito completo
                </Link>
              </Button>
            </div>
          </div>
        )}
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CartItemRowProps {
  item: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      size_us: number;
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

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { variant } = item;
  const { product_color } = variant;
  const { product } = product_color;
  const image = product_color.images[0]?.image_url;
  const maxQuantity = variant.stock_quantity;

  return (
    <li className="flex gap-3 sm:gap-4 p-4 sm:p-6">
      {/* Image */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
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
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase">
              {product.brand.name}
            </p>
            <Link
              href={`/producto/${product.slug}`}
              className="text-sm sm:text-base font-medium text-brand-black hover:underline line-clamp-2"
            >
              {product.name}
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {product_color.color_name} · Talla {variant.size_us}
            </p>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Price & Quantity */}
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= maxQuantity}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm sm:text-base font-semibold text-brand-black">
              {formatPrice(product.base_price * item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-gray-500">
                {formatPrice(product.base_price)} c/u
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
