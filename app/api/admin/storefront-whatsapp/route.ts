import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function normalizePhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });

  const db = createAdminClient() || auth.supabase;
  const { data, error } = await (db as any)
    .from('site_settings')
    .select('value')
    .eq('key', 'storefront_whatsapp_number')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'No se pudo cargar el WhatsApp.' }, { status: 500 });
  return NextResponse.json({ phoneNumber: data?.value || '50252498898' });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const phoneNumber = normalizePhone(body?.phoneNumber);
  if (phoneNumber.length < 8 || phoneNumber.length > 15) {
    return NextResponse.json({ error: 'Ingresa el número con código de país. Ejemplo: 50255555555.' }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }, { status: 500 });

  const { error } = await (db as any).from('site_settings').upsert({
    key: 'storefront_whatsapp_number',
    value: phoneNumber,
    updated_at: new Date().toISOString(),
    updated_by: auth.user.id,
  }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: 'No se pudo guardar el WhatsApp.' }, { status: 500 });
  return NextResponse.json({ success: true, phoneNumber });
}
