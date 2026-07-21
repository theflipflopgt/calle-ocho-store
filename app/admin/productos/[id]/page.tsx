import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ProductForm } from '../product-form';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_colors (
        id,
        color_name,
        color_code,
        sku_suffix,
        is_available,
        display_order,
        product_color_images (
          id,
          image_url,
          alt_text,
          display_order,
          image_type
        ),
        product_variants (
          id,
          size_us,
          size_eu,
          size_uk,
          size_cm,
          sku,
          stock_quantity,
          low_stock_threshold,
          price_override,
          is_available
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

async function getBrandsAndCategories() {
  const supabase = await createClient();

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
  ]);

  return { brands: brands || [], categories: categories || [] };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, { brands, categories }] = await Promise.all([
    getProduct(id),
    getBrandsAndCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Editar Producto</h1>
        <p className="text-gray-600 mt-1">Modifica los datos de {product.name}</p>
      </div>

      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
