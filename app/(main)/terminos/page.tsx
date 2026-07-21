import Image from 'next/image';
import { CreditCard, FileText, PackageCheck, RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Términos de uso | Calle Ocho Store',
  description: 'Términos de uso de Calle Ocho Store.',
};

export default function TerminosPage() {
  const sections = [
    ['Información de productos', 'Trabajamos para mantener precios, tallas, imágenes y disponibilidad actualizados. Si detectamos un error, te contactaremos antes de procesar el pedido.', PackageCheck],
    ['Pedidos', 'Todo pedido está sujeto a confirmación de inventario, datos de entrega y método de pago.', FileText],
    ['Pagos', 'No almacenamos datos completos de tarjetas. Los pagos se coordinan o procesan únicamente por medios autorizados.', CreditCard],
    ['Cambios', 'Los cambios dependen del estado del producto y de la disponibilidad de inventario.', RotateCcw],
  ] as const;

  return (
    <main>
      <section className="relative min-h-[320px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1521093470119-a3acdc43374a?q=80&w=1800&auto=format&fit=crop"
          alt="Términos de Calle Ocho Store"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[320px] items-center px-4 text-white">
          <div className="max-w-2xl">
            <FileText className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Términos de uso</h1>
            <p className="mt-4 text-lg text-white/90">
              Al comprar o navegar en Calle Ocho Store aceptas estas condiciones generales.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map(([title, text, Icon]) => (
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
