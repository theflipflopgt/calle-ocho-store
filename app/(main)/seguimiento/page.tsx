import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Estado del Pedido | Calle Ocho Store',
  description: 'Consulta como dar seguimiento a tu pedido en Calle Ocho Store.',
};

export default function SeguimientoPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <PackageSearch className="h-10 w-10 text-brand-blue mb-4" />
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Estado del Pedido
        </h1>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Después de confirmar tu compra, nuestro equipo te contactará para validar pago,
            disponibilidad y datos de entrega.
          </p>
          <p>
            Si ya tienes un número de pedido, puedes revisarlo desde tu cuenta o escribirnos
            para confirmar el estado actual.
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contacto">Contactar soporte</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
