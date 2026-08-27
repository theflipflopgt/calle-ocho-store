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

export interface HeroProductContent {
  badgeText: string | null;
  backgroundText: string | null;
  brandText: string | null;
  titleText: string | null;
  subtitleText: string | null;
  priceText: string | null;
  primaryButtonText: string | null;
  secondaryButtonText: string | null;
  showBadge: boolean;
  showBrand: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showPrice: boolean;
  showPrimaryButton: boolean;
  showSecondaryButton: boolean;
}

export interface HeroProductWithDetails extends ProductWithDetails {
  heroContent?: HeroProductContent;
}

// Props para el ProductCard
export interface ProductCardProps {
  product: ProductWithDetails;
  onAddToWishlist?: (productId: string) => void;
  onQuickAdd?: (variantId: string) => void;
  isInWishlist?: boolean;
}
