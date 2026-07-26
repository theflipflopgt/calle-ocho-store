import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_methods')
    .select('code:id, label, description, provider, is_enabled, display_order, requires_payment_link, supports_installments')
    .eq('is_enabled', true)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'No se pudieron cargar los métodos de pago.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ methods: data || [] });
}
