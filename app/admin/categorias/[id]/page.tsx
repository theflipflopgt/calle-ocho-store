import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CategoryForm } from '../category-form';

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

async function getCategory(id: string) {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !category) {
    return null;
  }

  return category;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Editar Categoría</h1>
        <p className="text-gray-600 mt-1">Modifica los datos de {category.name}</p>
      </div>

      <CategoryForm category={category} />
    </div>
  );
}
