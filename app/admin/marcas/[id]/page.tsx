import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BrandForm } from '../brand-form';

interface EditBrandPageProps {
  params: Promise<{ id: string }>;
}

async function getBrand(id: string) {
  const supabase = await createClient();

  const { data: brand, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !brand) {
    return null;
  }

  return brand;
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Editar Marca</h1>
        <p className="text-gray-600 mt-1">Modifica los datos de {brand.name}</p>
      </div>

      <BrandForm brand={brand} />
    </div>
  );
}
