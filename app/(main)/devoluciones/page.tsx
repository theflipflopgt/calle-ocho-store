export const metadata = {
  title: 'Cambios y devoluciones | Calle Ocho Store',
  description: 'Política de cambios y devoluciones de Calle Ocho Store.',
};

export default function DevolucionesPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Cambios y devoluciones
        </h1>
        <p className="mb-8 text-gray-600">
          Si necesitas cambiar una talla o reportar un problema con tu pedido, contáctanos lo antes posible.
        </p>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Condiciones</h2>
            <p>El producto debe estar sin uso, en buen estado y con su empaque original cuando aplique.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Cambios de talla</h2>
            <p>Los cambios dependen de la disponibilidad de inventario. Si la talla no está disponible, revisaremos alternativas contigo.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Productos en oferta</h2>
            <p>Algunas ofertas pueden tener condiciones especiales. Te recomendamos confirmar cualquier duda antes de comprar.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Cómo solicitar ayuda</h2>
            <p>Escríbenos con tu número de pedido, nombre completo y una breve descripción del caso.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
