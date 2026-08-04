'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function updateSellerCommissionRule(formData: FormData) {
  const auth = await requireAuthenticatedUser();

  if (!auth.user || !auth.isAdmin) {
    throw new Error('Permisos insuficientes.');
  }

  const sellerId = String(formData.get('seller_id') || '');
  const commissionPercent = Number(formData.get('commission_percent') || 0);

  if (!sellerId) {
    throw new Error('Selecciona un vendedor.');
  }

  if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    throw new Error('La comision debe estar entre 0 y 100.');
  }

  const admin = createAdminClient();
  const db = (admin || auth.supabase) as any;

  const { error } = await db
    .from('seller_commission_rules')
    .upsert(
      {
        seller_id: sellerId,
        commission_percent: commissionPercent,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'seller_id' }
    );

  if (error) {
    throw new Error('No se pudo guardar la comision.');
  }

  revalidatePath('/admin/vendedores');
}
