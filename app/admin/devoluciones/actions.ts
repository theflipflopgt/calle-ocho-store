'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';

const allowedTypes = new Set(['size_exchange', 'return', 'damaged_item', 'wrong_item']);

export async function createManualReturnRequest(formData: FormData) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user || !auth.isAdmin) redirect('/login');

  const orderNumber = String(formData.get('orderNumber') || '').trim().replace(/^#/, '');
  const requestType = String(formData.get('requestType') || 'size_exchange');
  const reason = String(formData.get('reason') || '').trim();

  if (!orderNumber || !allowedTypes.has(requestType) || reason.length < 5) {
    redirect('/admin/devoluciones?createError=invalid');
  }

  // Use the authenticated client so database audit triggers retain the admin actor.
  const db = auth.supabase as any;
  const { data: order } = await db
    .from('orders')
    .select('id,user_id,guest_email')
    .ilike('order_number', orderNumber)
    .maybeSingle();

  if (!order) redirect(`/admin/devoluciones?createError=order&orderNumber=${encodeURIComponent(orderNumber)}`);

  const { data: openRequest } = await db
    .from('return_requests')
    .select('id')
    .eq('order_id', order.id)
    .not('status', 'in', '(rejected,completed,cancelled)')
    .limit(1)
    .maybeSingle();

  if (openRequest) redirect(`/admin/devoluciones?createError=duplicate&q=${encodeURIComponent(orderNumber)}`);

  const { error } = await db.from('return_requests').insert({
    order_id: order.id,
    user_id: order.user_id,
    guest_email: order.guest_email,
    request_type: requestType,
    reason,
    status: 'requested',
  });

  if (error) redirect(`/admin/devoluciones?createError=save&orderNumber=${encodeURIComponent(orderNumber)}`);

  revalidatePath('/admin/devoluciones');
  redirect(`/admin/devoluciones?created=1&q=${encodeURIComponent(orderNumber)}`);
}
