import type { Tables } from './database.types';

export type Product = Tables<'products'>;
export type Brand = Tables<'brands'>;
export type Category = Tables<'categories'>;
export type ProductColor = Tables<'product_colors'>;
export type ProductColorImage = Tables<'product_color_images'>;
export type ProductVariant = Tables<'product_variants'>;

// Producto con relaciones para mostrar en cards
export interface ProductWithDetails extends Product {
  brand: Brand;
  category: Category;
  colors: (ProductColor & {
    images: ProductColorImage[];
    variants: ProductVariant[];
  })[];
  // Calculados
  totalStock: number;
  lowestPrice: number;
  hasDiscount: boolean;
  discountPercentage: number | null;
  isNew: boolean;
  isLowStock: boolean;
}

// Props para el ProductCard
export interface ProductCardProps {
  product: ProductWithDetails;
  onAddToWishlist?: (productId: string) => void;
  onQuickAdd?: (variantId: string) => void | Promise<void>;
  isInWishlist?: boolean;
}
