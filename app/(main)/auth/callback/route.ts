import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Support both 'next' and 'redirect' parameters
  const next = searchParams.get('next') ?? searchParams.get('redirect') ?? '/';

  console.log('🔄 [Auth Callback] Code:', code ? 'present' : 'missing');
  console.log('🔄 [Auth Callback] Redirect to:', next);

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  path: '/',
                })
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      console.log('✅ [Auth Callback] Session created for user:', data.user.id);
      const admin = createAdminClient();
      const userMetadata = data.user.user_metadata || {};
      const fullName =
        userMetadata.full_name || userMetadata.name || userMetadata.user_name || null;
      const avatarUrl = userMetadata.avatar_url || userMetadata.picture || null;

      if (admin && data.user.email) {
        const { data: existingProfile } = await (admin as any)
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (existingProfile) {
          await (admin as any)
            .from('profiles')
            .update({
              email: data.user.email,
              full_name: fullName,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id);
        } else {
          await (admin as any).from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: 'customer',
            updated_at: new Date().toISOString(),
          });
        }
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // If user is admin and no specific redirect, send to admin panel
      let finalRedirect = next;
      if (profile?.role === 'admin' && next === '/') {
        finalRedirect = '/admin';
        console.log('✅ [Auth Callback] Admin user detected, redirecting to /admin');
      } else {
        console.log('✅ [Auth Callback] Redirecting to:', next);
      }

      // Make sure the redirect URL is properly formed
      const redirectUrl = finalRedirect.startsWith('/') ? `${origin}${finalRedirect}` : finalRedirect;
      return NextResponse.redirect(redirectUrl);
    }

    if (error) {
      console.error('❌ [Auth Callback] Error exchanging code:', error.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
