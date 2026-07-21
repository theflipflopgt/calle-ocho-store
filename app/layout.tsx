import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import "./globals.css";

const defaultUrl = "https://calleochostore.com";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Calle Ocho Store | Tienda de Tenis en Guatemala",
    template: "%s | Calle Ocho Store",
  },
  description: "Tienda de tenis y sneakers en Guatemala. Las mejores marcas de moda urbana: Nike, Adidas, New Balance, Puma y más. Envío gratis en compras mayores a Q1,500.",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
