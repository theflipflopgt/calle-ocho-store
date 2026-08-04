import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const editableMethods = new Set([
  'bank_transfer',
  'cash_on_delivery',
  'neo_link_direct',
  'neo_link_installments',
  'card',
  'neocuotas',
]);

export async function GET() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Solo un administrador puede ver esta configuración.' }, { status: 403 });
  }

  const db = createAdminClient() || auth.supabase;
  const { data, error } = await (db as any)
    .from('payment_methods')
    .select('code:id, label, description, provider, is_enabled, display_order, requires_payment_link, supports_installments')
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'No se pudieron cargar los métodos de pago.' }, { status: 500 });
  }

  return NextResponse.json({ methods: data || [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Solo un administrador puede cambiar métodos de pago.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const code = String(body?.code || '');
  const isEnabled = body?.isEnabled;

  if (!editableMethods.has(code) || typeof isEnabled !== 'boolean') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const db = createAdminClient() || auth.supabase;
  const { error } = await (db as any)
    .from('payment_methods')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq('id', code);

  if (error) {
    return NextResponse.json({ error: 'No se pudo actualizar el método de pago.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
