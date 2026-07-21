import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.error('Error al cerrar sesión en Supabase:', error);
  }

  return NextResponse.json({ success: true });
}
