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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    // The SECURITY DEFINER function is the reliable fallback if a profile RLS
    // policy blocks the direct lookup. Without it, a real administrator can be
    // redirected to the storefront even though their session is valid.
    let role = profile?.role || null;
    if (!role || profileError) {
      const { data: secureProfile } = await supabase.rpc('current_authenticated_profile');
      role = typeof secureProfile === 'object' && secureProfile !== null && 'role' in secureProfile
        ? String(secureProfile.role)
        : null;
    }

    if (!['admin', 'seller', 'warehouse'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return copyCookies(response, NextResponse.redirect(url));
    }

    if (role === 'seller' && pathname === '/admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/ordenes';
      return copyCookies(response, NextResponse.redirect(url));
    }

    if (role === 'warehouse' && pathname === '/admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/productos';
      return copyCookies(response, NextResponse.redirect(url));
    }

    const sellerAllowedPaths = ['/admin/ordenes', '/admin/productos/inventario'];
    const warehouseAllowedPaths = [
      '/admin/productos',
      '/admin/marcas',
      '/admin/categorias',
      '/admin/media',
      '/admin/envios',
    ];

    if (role === 'seller' && !sellerAllowedPaths.some((path) => pathname.startsWith(path))) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/ordenes';
      return copyCookies(response, NextResponse.redirect(url));
    }

    if (role === 'warehouse' && !warehouseAllowedPaths.some((path) => pathname.startsWith(path))) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/productos';
      return copyCookies(response, NextResponse.redirect(url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/cuenta/:path*',
    '/account/:path*',
    '/pedidos/:path*',
    '/orders/:path*',
  ],
};
