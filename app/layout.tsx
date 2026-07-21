import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, type Profile } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { WishlistProvider } from '@/contexts/wishlist-context';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

const defaultUrl = 'https://calleochostore.com';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: 'Calle Ocho Store | Tienda de Tenis en Guatemala',
    template: '%s | Calle Ocho Store',
  },
  description: 'Tienda de tenis y sneakers en Guatemala. Las mejores marcas de moda urbana: Nike, Adidas, New Balance, Puma y más. Envío gratis en compras mayores a Q1,000.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    initialProfile = (data as Profile | null) ?? null;
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
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
