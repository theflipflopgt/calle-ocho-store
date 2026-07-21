import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithDetails } from '@/types/product';

interface GetProductsOptions {
  gender?: 'hombre' | 'mujer' | 'ninos' | 'unisex';
  brandSlug?: string;
  categorySlug?: string;
  onSale?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name';
}

export const getProducts = cache(async function getProducts(options: GetProductsOptions = {}): Promise<ProductWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      *,
      brand:brands!inner(*),
      category:categories!inner(*),
      colors:product_colors(
        *,
        images:product_color_images(*),
        variants:product_variants(*)
      )
    `)
    .eq('status', 'active');

  // Filtro por género
  if (options.gender) {
    query = query.or(`gender.eq.${options.gender},gender.eq.unisex`);
  }

  // Filtro por marca
  if (options.brandSlug) {
    query = query.eq('brand.slug', options.brandSlug);
  }

  // Filtro por categoría
  if (options.categorySlug) {
    query = query.eq('category.slug', options.categorySlug);
  }

  // Solo productos en oferta
  if (options.onSale) {
    query = query.not('compare_at_price', 'is', null);
  }

  // Búsqueda por texto
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.name.ilike.%${searchTerm}%`);
  }

  // Ordenamiento
  switch (options.sortBy) {
    case 'price-asc':
      query = query.order('base_price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('base_price', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Paginación
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Transformar los datos para calcular campos adicionales
  return (data || []).map(transformProduct);
});

export const getProductBySlug = cache(async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(*),
      category:categories(*),
      colors:product_colors(
        *,
        images:product_color_images(*),
        variants:product_variants(*)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    console.error('Error fetching product:', error);
    return null;
  }

  return transformProduct(data);
});

export const getBrands = cache(async function getBrands() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }

  return data || [];
});

export const getCategories = cache(async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
});

export const getFeaturedProducts = cache(async function getFeaturedProducts(): Promise<ProductWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('featured_products')
    .select(`
      product:products (
        *,
        brand:brands(*),
        category:categories(*),
        colors:product_colors(
          *,
          images:product_color_images(*),
          variants:product_variants(*)
        )
      )
    `)
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }

  // Extract products and transform them
  const products = (data || [])
    .map((item: any) => item.product)
    .filter(Boolean);

  return products.map(transformProduct);
});

// Función auxiliar para transformar producto de BD a ProductWithDetails
function transformProduct(product: any): ProductWithDetails {
  const colors = product.colors || [];

  // Calcular stock total
  let totalStock = 0;
  let lowestPrice = product.base_price;
  let isLowStock = false;

  colors.forEach((color: any) => {
    (color.variants || []).forEach((variant: any) => {
      totalStock += variant.stock_quantity || 0;
      if (variant.stock_quantity > 0 && variant.stock_quantity <= (variant.low_stock_threshold || 3)) {
        isLowStock = true;
      }
    });
  });

  // Calcular descuento
  const hasDiscount = !!product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.base_price / product.compare_at_price) * 100)
    : null;

  // Determinar si es nuevo (menos de 30 días)
  const createdAt = new Date(product.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isNew = createdAt > thirtyDaysAgo;

  return {
    ...product,
    totalStock,
    lowestPrice,
    hasDiscount,
    discountPercentage,
    isNew,
    isLowStock: isLowStock && totalStock > 0,
  };
}
