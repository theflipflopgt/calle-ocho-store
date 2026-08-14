import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithDetails } from '@/types/product';
import { sortAndLimitProductImages } from '@/lib/products/product-images';

interface GetProductsOptions {
  gender?: 'hombre' | 'mujer' | 'ninos' | 'unisex';
  brandSlug?: string;
  categorySlug?: string;
  onSale?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  size?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name';
}

interface GetNewReleaseProductsOptions {
  limit?: number;
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
    const legacyGenderMap: Record<NonNullable<GetProductsOptions['gender']>, string> = {
      hombre: 'men',
      mujer: 'women',
      ninos: 'kids',
      unisex: 'unisex',
    };
    query = query.in('gender', Array.from(new Set([options.gender, legacyGenderMap[options.gender]])));
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

  const searchTerm = options.search?.trim();

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

  const products = (data || []).map(transformProduct);

  let filteredProducts = products;

  if (options.size) {
    const selectedSize = Number(options.size);
    filteredProducts = filteredProducts.filter((product) =>
      product.colors.some((color) =>
        color.variants.some(
          (variant) =>
            variant.size_us === selectedSize &&
            variant.is_available &&
            Number(variant.stock_quantity || 0) > 0
        )
      )
    );
  }

  if (searchTerm) {
    const tokens = normalizeSearch(searchTerm)
      .split(/\s+/)
      .filter(Boolean);

    filteredProducts = filteredProducts.filter((product) => {
      const searchableText = normalizeSearch(
        [
          product.name,
          product.sku,
          product.description || '',
          product.brand?.name || '',
          product.brand?.slug || '',
          product.category?.name || '',
          product.category?.slug || '',
          product.gender || '',
          ...product.colors.flatMap((color: any) => [
            color.color_name || '',
            color.sku_suffix || '',
            ...color.variants.map((variant: any) => variant.sku || ''),
          ]),
        ].join(' ')
      );

      return tokens.every((token) => searchableText.includes(token));
    });
  }

  if (options.onSale) {
    filteredProducts = filteredProducts.filter((product) => product.hasDiscount);
  }

  return filteredProducts;
});

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim();
}


export const getNewReleaseProducts = cache(async function getNewReleaseProducts(
  options: GetNewReleaseProductsOptions = {}
): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

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
    .eq('status', 'active')
    .eq('is_new_release', true)
    .or(`new_release_until.is.null,new_release_until.gte.${now}`)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching new release products:', error);
    return [];
  }

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

  const { data: carouselRows, error: carouselError } = await supabase
    .from('featured_products')
    .select(`
      display_order,
      product:products!inner(
        *,
        brand:brands!inner(*),
        category:categories!inner(*),
        colors:product_colors(
          *,
          images:product_color_images(*),
          variants:product_variants(*)
        )
      )
    `)
    .eq('is_active', true)
    .eq('product.status', 'active')
    .order('display_order', { ascending: true })
    .limit(5);

  if (!carouselError && carouselRows && carouselRows.length > 0) {
    return carouselRows
      .map((row: any) => row.product)
      .filter(Boolean)
      .map(transformProduct);
  }

  if (carouselError) {
    console.error('Error fetching managed hero carousel:', carouselError);
  }

  // Compatibilidad con productos marcados como destacados antes de existir
  // el administrador ordenable del Hero Carousel.
  const { data: legacyProducts, error: legacyError } = await supabase
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
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (legacyError) {
    console.error('Error fetching legacy featured products:', legacyError);
    return [];
  }

  return (legacyProducts || []).map(transformProduct);
});

// Función auxiliar para transformar producto de BD a ProductWithDetails
function transformProduct(product: any): ProductWithDetails {
  const colors = [...(product.colors || [])]
    .sort(
      (a: any, b: any) =>
        Number(a.display_order || 0) - Number(b.display_order || 0)
    )
    .map((color: any) => ({
      ...color,
      images: sortAndLimitProductImages(color.images || []),
    }));

  // Calcular stock total
  let totalStock = 0;
  const availablePrices: number[] = [];
  let isLowStock = false;

  colors.forEach((color: any) => {
    (color.variants || []).forEach((variant: any) => {
      totalStock += variant.stock_quantity || 0;
      if (variant.is_available && variant.stock_quantity > 0) {
        availablePrices.push(Number(variant.price_override ?? product.base_price));
      }
      if (variant.stock_quantity > 0 && variant.stock_quantity <= (variant.low_stock_threshold || 3)) {
        isLowStock = true;
      }
    });
  });

  const lowestPrice = availablePrices.length > 0
    ? Math.min(...availablePrices)
    : Number(product.base_price);

  // Calcular descuento
  const hasDiscount = !!product.compare_at_price && product.compare_at_price > lowestPrice;
  const discountPercentage = hasDiscount
    ? Math.round((1 - lowestPrice / product.compare_at_price) * 100)
    : null;

  // El distintivo de nuevo lanzamiento se controla desde administración.
  const releaseEnd = product.new_release_until
    ? new Date(product.new_release_until)
    : null;
  const isNew = Boolean(
    product.is_new_release && (!releaseEnd || releaseEnd >= new Date())
  );

  return {
    ...product,
    colors,
    totalStock,
    lowestPrice,
    hasDiscount,
    discountPercentage,
    isNew,
    isLowStock: isLowStock && totalStock > 0,
  };
}
