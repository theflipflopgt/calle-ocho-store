'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trash2, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistContext } from '@/contexts/wishlist-context';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/currency';
import type { ProductWithDetails } from '@/types/product';

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  brand: { name: string; slug: string };
  colors: {
    id: string;
    color_name: string;
    color_code: string;
    images: { image_url: string }[];
    variants: { id: string; size_us: number; stock_quantity: number; is_available: boolean }[];
  }[];
}

const WISHLIST_PRODUCTS_TIMEOUT_MS = 4000;

async function withTimeout<T>(promise: PromiseLike<T>, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), WISHLIST_PRODUCTS_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function wishlistProductFromSnapshot(product: ProductWithDetails): WishlistProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    base_price: product.base_price,
    compare_at_price: product.compare_at_price,
    brand: { name: product.brand.name, slug: product.brand.slug },
    colors: product.colors.map((color) => ({
      id: color.id,
      color_name: color.color_name,
      color_code: color.color_code || '',
      images: color.images.map((image) => ({ image_url: image.image_url })),
      variants: color.variants.map((variant) => ({
        id: variant.id,
        size_us: variant.size_us,
        stock_quantity: variant.stock_quantity,
        is_available: variant.is_available ?? true,
      })),
    })),
  };
}

export default function WishlistPage() {
  const { items, loading: wishlistLoading, toggleWishlist, clearWishlist } = useWishlistContext();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  // Fetch product details for wishlist items
  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setProducts([]);
        setIsLoadingProducts(false);
        return;
      }

      const productIds = items.map(item => item.product_id);
      const snapshotProducts = items
        .filter((item) => item.productSnapshot)
        .map((item) => wishlistProductFromSnapshot(item.productSnapshot!));

      if (snapshotProducts.length === items.length) {
        setProducts(snapshotProducts);
        setIsLoadingProducts(false);
        return;
      }

      const { data, error } = await withTimeout(
        supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            base_price,
            compare_at_price,
            brand:brands(name, slug),
            colors:product_colors(
              id,
              color_name,
              color_code,
              images:product_color_images(image_url),
              variants:product_variants(id, size_us, stock_quantity, is_available)
            )
          `)
          .in('id', productIds),
        {
          data: null,
          error: { name: 'PostgrestError', message: 'Wishlist products timeout', details: '', hint: '', code: 'TIMEOUT' },
          count: null,
          status: 408,
          statusText: 'Request Timeout',
        }
      );

      if (!error && data) {
        const fetchedProducts = data as unknown as WishlistProduct[];
        const fetchedIds = new Set(fetchedProducts.map((product) => product.id));
        const missingSnapshots = snapshotProducts.filter((product) => !fetchedIds.has(product.id));
        setProducts([...fetchedProducts, ...missingSnapshots]);
      } else {
        setProducts(snapshotProducts);
      }
      setIsLoadingProducts(false);
    }

    if (!wishlistLoading) {
      fetchProducts();
    }
  }, [items, wishlistLoading, supabase]);

  if (wishlistLoading || isLoadingProducts) {
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
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-white mb-3">
            Tu lista de deseos está vacía
          </h1>
          <p className="text-gray-500 dark:text-gray-300 mb-8">
            Guarda tus productos favoritos para comprarlos después
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-white">
            Lista de Deseos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            {items.length} producto{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-auto"
          onClick={clearWishlist}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Vaciar lista
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <WishlistCard
            key={product.id}
            product={product}
            onRemove={() => toggleWishlist(product.id)}
          />
        ))}
      </div>
    </main>
  );
}

interface WishlistCardProps {
  product: WishlistProduct;
  onRemove: () => void;
}

function WishlistCard({ product, onRemove }: WishlistCardProps) {
  const firstColor = product.colors[0];
  const image = firstColor?.images[0]?.image_url;
  const hasStock = firstColor?.variants?.some(v => v.is_available !== false && v.stock_quantity > 0);
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
        <Link href={`/producto/${product.slug}`}>
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </Link>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors text-red-500"
          aria-label="Eliminar de lista de deseos"
        >
          <Heart className="w-5 h-5 fill-current" />
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-brand-red text-white text-xs font-semibold px-2 py-1 rounded">
            -{Math.round((1 - product.base_price / product.compare_at_price!) * 100)}%
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!hasStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-brand-black text-sm font-medium px-4 py-2 rounded-lg">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-1">
          {product.brand.name}
        </p>
        <Link href={`/producto/${product.slug}`}>
          <h3 className="font-medium text-brand-black dark:text-white line-clamp-2 hover:underline mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-bold text-brand-black dark:text-white">
            {formatPrice(product.base_price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {hasStock ? (
            <Button
              className="flex-1 h-10 bg-brand-black hover:bg-gray-800"
              asChild
            >
              <Link href={`/producto/${product.slug}`}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Elegir talla
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1 h-10"
              asChild
            >
              <Link href={`/producto/${product.slug}`}>
                Ver detalles
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
