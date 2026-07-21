export const metadata = {
  title: 'Términos de Uso | Calle Ocho Store',
  description: 'Términos generales de uso de Calle Ocho Store.',
};

export default function TerminosPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Términos de Uso
        </h1>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Al usar Calle Ocho Store aceptas que la información de productos, precios,
            disponibilidad y promociones puede actualizarse sin previo aviso.
          </p>
          <p>
            Los pedidos quedan sujetos a confirmación de inventario, validación de datos y
            confirmación de pago cuando corresponda.
          </p>
          <p>
            No está permitido usar el sitio para actividades fraudulentas, automatizadas o
            que afecten la operación normal de la tienda.
          </p>
        </div>
      </div>
    </main>
  );
}
