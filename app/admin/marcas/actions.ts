'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface BrandData {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  country: string | null;
  website_url: string | null;
  is_active: boolean;
}

export async function createBrand(data: BrandData) {
  const supabase = await createClient();

  const { error } = await supabase.from('brands').insert(data);

  if (error) {
    console.error('Error creating brand:', error);
    return { error: 'Error al crear la marca. El nombre o slug podría estar duplicado.' };
  }

  revalidatePath('/admin/marcas');
  redirect('/admin/marcas');
}

export async function updateBrand(id: string, data: BrandData) {
  const supabase = await createClient();

  const { error } = await supabase.from('brands').update(data).eq('id', id);

  if (error) {
    console.error('Error updating brand:', error);
    return { error: 'Error al actualizar la marca. El slug podría estar duplicado.' };
  }

  revalidatePath('/admin/marcas');
  redirect('/admin/marcas');
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('brands').delete().eq('id', id);

  if (error) {
    console.error('Error deleting brand:', error);
    return { error: 'Error al eliminar la marca.' };
  }

  revalidatePath('/admin/marcas');
}
