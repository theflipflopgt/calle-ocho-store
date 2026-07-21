export const metadata = {
  title: 'Términos de uso | Calle Ocho Store',
  description: 'Términos de uso de Calle Ocho Store.',
};

export default function TerminosPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Términos de uso
        </h1>
        <p className="mb-8 text-gray-600">
          Al comprar o navegar en Calle Ocho Store aceptas estas condiciones generales.
        </p>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Información de productos</h2>
            <p>Trabajamos para mantener precios, tallas, imágenes y disponibilidad actualizados. Si detectamos un error, te contactaremos antes de procesar el pedido.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Pedidos</h2>
            <p>Todo pedido está sujeto a confirmación de inventario, datos de entrega y método de pago.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Pagos</h2>
            <p>No almacenamos datos completos de tarjetas. Los pagos se coordinan o procesan únicamente por medios autorizados.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Cambios</h2>
            <p>Los cambios dependen del estado del producto y de la disponibilidad de inventario.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
