import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { PromoTicker } from "@/components/home/promo-ticker";
import { createClient } from "@/lib/supabase/server";

const defaultUrl = "https://calleochostore.com";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Calle Ocho Store | Tienda de Tenis en Guatemala",
    template: "%s | Calle Ocho Store",
  },
  description: "Tienda de tenis y sneakers en Guatemala. Las mejores marcas de moda urbana: Nike, Adidas, New Balance, Puma y más. Envío gratis en compras mayores a Q1,000.",
  keywords: ["tenis", "sneakers", "zapatos", "Guatemala", "Nike", "Adidas", "New Balance", "Puma", "moda urbana", "tienda de tenis", "Calle Ocho Store"],
  authors: [{ name: "Calle Ocho Store" }],
  creator: "Soluciones Web 2025",
  publisher: "Calle Ocho Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_GT",
    url: defaultUrl,
    siteName: "Calle Ocho Store",
    title: "Calle Ocho Store | Tienda de Tenis en Guatemala",
    description: "Tienda de tenis y sneakers en Guatemala. Las mejores marcas de moda urbana. Envío gratis en compras mayores a Q1,000.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calle Ocho Store | Tienda de Tenis en Guatemala",
    description: "Tienda de tenis y sneakers en Guatemala. Las mejores marcas de moda urbana.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let whatsappNumber = "50252498898";
  try {
    const supabase = await createClient();
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "storefront_whatsapp_number")
      .maybeSingle();
    const configured = String(data?.value || "").replace(/\D/g, "");
    if (configured) whatsappNumber = configured;
  } catch {
    // Keep the current business number as a safe fallback before migration.
  }

  return (
    <>
      <PromoTicker />
      <Header />
      <main className="min-h-screen">{children}</main>
      <CartDrawer />
      <WhatsAppButton phoneNumber={whatsappNumber} />
      <Footer />
    </>
  );
}
