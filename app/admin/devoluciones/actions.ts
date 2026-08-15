'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createReturnRequestWithFallback } from '@/lib/admin/return-server-fallback';

const allowedTypes = new Set(['size_exchange', 'return', 'damaged_item', 'wrong_item']);

export async function createManualReturnRequest(formData: FormData) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) redirect('/auth/login');
  if (!auth.isAdmin) redirect('/admin/devoluciones?createError=permission');

  const orderNumber = String(formData.get('orderNumber') || '').trim().replace(/^#/, '');
  const requestType = String(formData.get('requestType') || 'size_exchange');
  const reason = String(formData.get('reason') || '').trim();

  if (!orderNumber || !allowedTypes.has(requestType) || reason.length < 5) {
    redirect('/admin/devoluciones?createError=invalid');
  }

  const { errorCode } = await createReturnRequestWithFallback(auth, {
    orderNumber,
    requestType,
    reason,
  });

  if (errorCode) {
    redirect(`/admin/devoluciones?createError=${errorCode}&orderNumber=${encodeURIComponent(orderNumber)}`);
  }

  revalidatePath('/admin/devoluciones');
  redirect(`/admin/devoluciones?created=1&q=${encodeURIComponent(orderNumber)}`);
}
