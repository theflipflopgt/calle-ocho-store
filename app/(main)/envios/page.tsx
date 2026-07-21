import Image from 'next/image';
import { MapPin, PackageCheck, Truck } from 'lucide-react';

export const metadata = {
  title: 'Envío y entrega | Calle Ocho Store',
  description: 'Información sobre envíos y entregas de Calle Ocho Store en Guatemala.',
};

export default function EnviosPage() {
  return (
    <main>
      <section className="relative min-h-[360px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1800&auto=format&fit=crop"
          alt="Entrega de calzado"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[360px] items-center px-4">
          <div className="max-w-2xl text-white">
            <Truck className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Envío y entrega</h1>
            <p className="mt-4 text-lg text-white/90">
              Queremos que recibas tus tenis de forma clara, segura y sin sorpresas.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <MapPin className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Cobertura</h2>
            <p>Realizamos entregas en Guatemala. La disponibilidad puede variar según la zona y la dirección final.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <PackageCheck className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Coordinación</h2>
            <p>Después de confirmar tu pedido, te contactaremos para coordinar el pago, la dirección y el horario de entrega.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <Truck className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Costo de envío</h2>
            <p>El costo se mostrará durante el checkout. Las compras mayores a Q1,500 pueden aplicar a envío gratis.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <PackageCheck className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Seguimiento</h2>
            <p>Cuando el pedido sea enviado, podrás recibir una actualización por correo con los detalles disponibles.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
