import { Truck } from 'lucide-react';

export const metadata = {
  title: 'Envío y Entrega | Calle Ocho Store',
  description: 'Información de envíos y entregas de Calle Ocho Store en Guatemala.',
};

export default function EnviosPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <Truck className="h-10 w-10 text-brand-blue mb-4" />
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Envío y Entrega
        </h1>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Coordinamos entregas dentro de Guatemala según cobertura disponible,
            dirección del cliente y disponibilidad del producto.
          </p>
          <p>
            El costo y tiempo estimado de envío se confirman durante el checkout o por
            contacto directo con nuestro equipo.
          </p>
          <p>
            Las compras mayores a Q1,500 pueden aplicar a envío gratis cuando la zona de
            entrega esté dentro de la cobertura activa.
          </p>
        </div>
      </div>
    </main>
  );
}
