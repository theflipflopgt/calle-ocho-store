'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';

const allowedTypes = new Set(['size_exchange', 'return', 'damaged_item', 'wrong_item']);

export async function createManualReturnRequest(formData: FormData) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) redirect('/auth/login');

  const orderNumber = String(formData.get('orderNumber') || '').trim().replace(/^#/, '');
  const requestType = String(formData.get('requestType') || 'size_exchange');
  const reason = String(formData.get('reason') || '').trim();

  if (!orderNumber || !allowedTypes.has(requestType) || reason.length < 5) {
    redirect('/admin/devoluciones?createError=invalid');
  }

  const { error } = await (auth.supabase as any).rpc('admin_create_return_request', {
    p_order_number: orderNumber,
    p_request_type: requestType,
    p_reason: reason,
  });

  if (error) {
    const message = String(error.message || '');
    const code = message.includes('ORDER_NOT_FOUND')
      ? 'order'
      : message.includes('OPEN_RETURN_EXISTS')
        ? 'duplicate'
        : 'save';
    redirect(`/admin/devoluciones?createError=${code}&orderNumber=${encodeURIComponent(orderNumber)}`);
  }

  revalidatePath('/admin/devoluciones');
  redirect(`/admin/devoluciones?created=1&q=${encodeURIComponent(orderNumber)}`);
}
