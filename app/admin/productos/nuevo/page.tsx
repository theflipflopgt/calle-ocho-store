import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '../product-form';

async function getBrandsAndCategories() {
  const supabase = await createClient();

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
  ]);

  return { brands: brands || [], categories: categories || [] };
}

export default async function NewProductPage() {
  const { brands, categories } = await getBrandsAndCategories();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Nuevo Producto</h1>
        <p className="text-gray-600 mt-1">Agrega un nuevo producto a la tienda</p>
      </div>

      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
