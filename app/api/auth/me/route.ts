import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({
      user: null,
      profile: null,
      isAdmin: false,
      canAccessAdmin: false,
    });
  }

  const profileDb = createAdminClient() || auth.supabase;
  const { data: profile } = await profileDb
    .from('profiles')
    .select('id, full_name, email, phone, role, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      phone: auth.user.phone,
    },
    profile: profile || null,
    isAdmin: auth.isAdmin,
    canAccessAdmin: auth.canAccessAdmin,
  });
}
