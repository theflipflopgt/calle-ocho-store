import Image from 'next/image';
import { CheckCircle2, RotateCcw, ShoppingBag, MessageCircle } from 'lucide-react';
import { getHomeContent } from '@/lib/home-content';

export const metadata = {
  title: 'Cambios y devoluciones | Calle Ocho Store',
  description: 'Política de cambios y devoluciones de Calle Ocho Store.',
};

export default async function DevolucionesPage() {
  const homeContent = await getHomeContent();
  const items = [
    ['Condiciones', 'El producto debe estar sin uso, en buen estado y con su empaque original cuando aplique.', CheckCircle2],
    ['Cambios de talla', 'Los cambios dependen de la disponibilidad de inventario. Si la talla no está disponible, revisaremos alternativas contigo.', RotateCcw],
    ['Productos en oferta', 'Algunas ofertas pueden tener condiciones especiales. Te recomendamos confirmar cualquier duda antes de comprar.', ShoppingBag],
    ['Cómo solicitar ayuda', 'Escríbenos con tu número de pedido, nombre completo y una breve descripción del caso.', MessageCircle],
  ] as const;

  return (
    <main>
      <section className="relative min-h-[340px] overflow-hidden">
        <Image
          src={homeContent.footerPages.devoluciones.image}
          alt={homeContent.footerPages.devoluciones.alt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[340px] items-center px-4 text-white">
          <div className="max-w-2xl">
            <RotateCcw className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Cambios y devoluciones</h1>
            <p className="mt-4 text-lg text-white/90">
              Si necesitas cambiar una talla o reportar un problema con tu pedido, contáctanos lo antes posible.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(([title, text, Icon]) => (
            <div key={title} className="rounded-lg border border-gray-200 bg-white p-5">
              <Icon className="mb-3 h-6 w-6 text-brand-blue" />
              <h2 className="mb-2 text-lg font-semibold text-brand-black">{title}</h2>
              <p className="text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
