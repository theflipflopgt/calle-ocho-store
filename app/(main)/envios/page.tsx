export const metadata = {
  title: 'Envío y entrega | Calle Ocho Store',
  description: 'Información sobre envíos y entregas de Calle Ocho Store en Guatemala.',
};

export default function EnviosPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Envío y entrega
        </h1>
        <p className="mb-8 text-gray-600">
          Queremos que recibas tus tenis de forma clara, segura y sin sorpresas.
        </p>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Cobertura</h2>
            <p>Realizamos entregas en Guatemala. La disponibilidad puede variar según la zona y la dirección final.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Coordinación</h2>
            <p>Después de confirmar tu pedido, te contactaremos para coordinar el pago, la dirección y el horario de entrega.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Costo de envío</h2>
            <p>El costo se mostrará durante el checkout. Las compras mayores a Q1,500 pueden aplicar a envío gratis.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Seguimiento</h2>
            <p>Cuando el pedido sea enviado, podrás recibir una actualización por correo con los detalles disponibles.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
