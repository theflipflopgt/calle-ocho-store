import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, type Profile } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { WishlistProvider } from '@/contexts/wishlist-context';
import { createClient } from '@/lib/supabase/server';
import { getServerProfile } from '@/lib/auth/server-profile';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { GoogleTagManager } from '@/components/analytics/google-tag-manager';
import './globals.css';

const defaultUrl = 'https://calleochostore.com';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: 'Calle Ocho Store | Tienda de Tenis en Guatemala',
    template: '%s | Calle Ocho Store',
  },
  description: 'Compra tenis, sneakers, ropa y accesorios originales en Guatemala. Encuentra Nike, Adidas, New Balance, Puma y más en Calle Ocho Store.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_GT',
    url: '/',
    siteName: 'Calle Ocho Store',
    title: 'Calle Ocho Store | Tenis y sneakers en Guatemala',
    description: 'Compra tenis, sneakers, ropa y accesorios originales en Guatemala.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Calle Ocho Store' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calle Ocho Store | Tenis y sneakers en Guatemala',
    description: 'Compra tenis, sneakers, ropa y accesorios originales en Guatemala.',
    images: ['/twitter-image.png'],
  },
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile: Profile | null = null;
  if (user) {
    initialProfile = await getServerProfile(supabase, user.id);
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <GoogleTagManager />
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider
            initialUser={user}
            initialProfile={initialProfile}
            initialIsAdmin={initialProfile?.role === 'admin'}
            initialCanAccessAdmin={['admin', 'seller', 'warehouse'].includes(initialProfile?.role || '')}
          >
            <CartProvider>
              <WishlistProvider>{children}</WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
