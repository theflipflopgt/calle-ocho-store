import Image from 'next/image';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { getHomeContent } from '@/lib/home-content';

export const metadata = {
  title: 'Nuestra historia | Calle Ocho Store',
  description: 'Conoce la historia y el propósito de Calle Ocho Store.',
};

export default async function NosotrosPage() {
  const homeContent = await getHomeContent();

  return (
    <main>
      <section className="relative min-h-[380px] overflow-hidden">
        <Image
          src={homeContent.footerPages.nosotros.image}
          alt={homeContent.footerPages.nosotros.alt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[380px] items-center px-4 text-white">
          <div className="max-w-2xl">
            <Sparkles className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Nuestra historia</h1>
            <p className="mt-4 text-lg text-white/90">
              Calzado urbano, cómodo y auténtico para quienes buscan estilo en cada paso.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <Heart className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="font-semibold text-brand-black">Enfoque</h2>
            <p className="mt-2 text-gray-600">Tenis y sneakers de marcas reconocidas, con una experiencia sencilla y clara.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <ShieldCheck className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="font-semibold text-brand-black">Confianza</h2>
            <p className="mt-2 text-gray-600">Información visible sobre talla, disponibilidad, precio y estado del pedido.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <Sparkles className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="font-semibold text-brand-black">Evolución</h2>
            <p className="mt-2 text-gray-600">Seguimos construyendo una tienda más ordenada, segura y fácil de administrar.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
