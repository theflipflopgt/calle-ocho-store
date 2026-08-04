import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { getServerProfile } from '@/lib/auth/server-profile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function identityResponse(body: Record<string, unknown>) {
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}

export async function GET() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return identityResponse({
      user: null,
      profile: null,
      isAdmin: false,
      canAccessAdmin: false,
    });
  }

  const profile = await getServerProfile(auth.supabase, auth.user.id);

  return identityResponse({
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
