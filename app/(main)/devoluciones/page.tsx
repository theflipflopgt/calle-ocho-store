import { RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Devoluciones | Calle Ocho Store',
  description: 'Política general de cambios y devoluciones de Calle Ocho Store.',
};

export default function DevolucionesPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <RotateCcw className="h-10 w-10 text-brand-blue mb-4" />
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Devoluciones
        </h1>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Aceptamos solicitudes de cambio cuando el producto conserva su estado original,
            empaque y comprobante de compra.
          </p>
          <p>
            Las solicitudes deben reportarse lo antes posible después de recibir el pedido.
            Nuestro equipo validará talla, estado del producto y disponibilidad para cambio.
          </p>
          <p>
            Productos usados, dañados por uso o sin empaque original pueden no aplicar para
            cambio o devolución.
          </p>
        </div>
      </div>
    </main>
  );
}
