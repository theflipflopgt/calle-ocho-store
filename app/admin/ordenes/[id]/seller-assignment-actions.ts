'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const admin = createAdminClient();
  const db = (admin || auth.supabase) as any;

  const { data: order, error: orderError } = await db
    .from('orders')
    .select('id, total')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('No se encontro la orden.');
  }

  let commissionRate = 0;

  if (sellerId) {
    const { data: rule } = await db
      .from('seller_commission_rules')
      .select('commission_percent')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .maybeSingle();

    commissionRate = Number(rule?.commission_percent || 0);
  }

  const commissionAmount = Math.round(Number(order.total || 0) * commissionRate) / 100;

  const { error } = await db
    .from('orders')
    .update({
      seller_id: sellerId || null,
      seller_commission_rate: sellerId ? commissionRate : 0,
      seller_commission_amount: sellerId ? commissionAmount : 0,
    })
    .eq('id', orderId);

  if (error) {
    throw new Error('No se pudo asignar el vendedor.');
  }

  revalidatePath(`/admin/ordenes/${orderId}`);
  revalidatePath('/admin/vendedores');
}
