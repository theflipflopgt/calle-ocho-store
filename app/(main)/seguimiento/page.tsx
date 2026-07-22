import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Clock, PackageCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingForm } from './tracking-form';

export const metadata = {
  title: 'Estado del pedido | Calle Ocho Store',
  description: 'Consulta el estado de tus pedidos en Calle Ocho Store.',
};

export default function SeguimientoPage() {
  const statuses = [
    ['Pendiente', 'Recibimos tu pedido y estamos validando la información.', Clock],
    ['Pagado', 'El pago fue confirmado.', CheckCircle2],
    ['En preparación', 'Estamos preparando tus productos.', PackageCheck],
    ['Enviado', 'Tu pedido salió hacia la dirección registrada.', Truck],
    ['Entregado', 'El pedido fue recibido correctamente.', CheckCircle2],
  ] as const;

  return (
    <main>
      <section className="relative min-h-[340px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1800&auto=format&fit=crop"
          alt="Seguimiento de pedido"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[340px] items-center px-4 text-white">
          <div className="max-w-2xl">
            <PackageCheck className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Estado del pedido</h1>
            <p className="mt-4 text-lg text-white/90">
              Consulta el estado actual con tu número de pedido y el correo o teléfono usado en la compra.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <TrackingForm />

        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {statuses.map(([title, text, Icon]) => (
            <div key={title} className="rounded-lg border border-gray-200 bg-white p-4">
              <Icon className="mb-3 h-5 w-5 text-brand-blue" />
              <h2 className="font-semibold text-brand-black">{title}</h2>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/contacto">Necesito ayuda</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
