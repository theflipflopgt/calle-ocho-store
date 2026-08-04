'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';

export async function updateOrderSeller(formData: FormData) {
  const auth = await requireAuthenticatedUser();

  if (!auth.user || !auth.isAdmin) {
    throw new Error('Permisos insuficientes.');
  }

  const orderId = String(formData.get('order_id') || '');
  const sellerId = String(formData.get('seller_id') || '');

  if (!orderId) {
    throw new Error('Falta la orden.');
  }

  const { error } = await (auth.supabase as any).rpc('admin_assign_order_seller', {
    p_order_id: orderId,
    p_seller_id: sellerId || null,
  });

  if (error) {
    throw new Error('No se pudo asignar el vendedor.');
  }

  revalidatePath(`/admin/ordenes/${orderId}`);
  revalidatePath('/admin/vendedores');
}
