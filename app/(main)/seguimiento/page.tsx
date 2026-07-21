import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Estado del pedido | Calle Ocho Store',
  description: 'Consulta el estado de tus pedidos en Calle Ocho Store.',
};

export default function SeguimientoPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
          <PackageCheck className="h-6 w-6" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Estado del pedido
        </h1>
        <p className="mb-8 text-gray-600">
          Desde tu cuenta puedes revisar tus pedidos, ver el estado actual y consultar los detalles de compra.
        </p>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-brand-black">Estados principales</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            <li><strong>Pendiente:</strong> recibimos tu pedido y estamos validando la información.</li>
            <li><strong>Pagado:</strong> el pago fue confirmado.</li>
            <li><strong>En preparación:</strong> estamos preparando tus productos.</li>
            <li><strong>Enviado:</strong> tu pedido salió hacia la dirección registrada.</li>
            <li><strong>Entregado:</strong> el pedido fue recibido correctamente.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="bg-brand-black hover:bg-gray-800">
            <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contacto">Necesito ayuda</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
