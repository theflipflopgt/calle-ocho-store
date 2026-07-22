import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            });
          });
        },
      },
    }
  );

  // getClaims refreshes stale tokens and writes the refreshed cookies through setAll.
  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  const pathname = request.nextUrl.pathname;

  const protectedPaths = ['/cuenta', '/account', '/pedidos', '/orders'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (pathname.startsWith('/admin')) {
    if (!userId) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
      return copyCookies(response, NextResponse.redirect(url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const role = profile?.role || null;

    if (!['admin', 'seller'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return copyCookies(response, NextResponse.redirect(url));
    }

    if (role === 'seller' && pathname === '/admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/ordenes';
      return copyCookies(response, NextResponse.redirect(url));
    }

    if (role === 'seller' && !pathname.startsWith('/admin/ordenes')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/ordenes';
      return copyCookies(response, NextResponse.redirect(url));
    }
  }

  const authPaths = ['/auth/login', '/auth/registro', '/auth/sign-up'];
  if (userId && authPaths.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api).*)',
  ],
};
