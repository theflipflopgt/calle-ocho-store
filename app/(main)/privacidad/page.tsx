export const metadata = {
  title: 'Política de privacidad | Calle Ocho Store',
  description: 'Política de privacidad y uso de datos de Calle Ocho Store.',
};

export default function PrivacidadPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Política de privacidad
        </h1>
        <p className="mb-8 text-gray-600">
          Cuidamos tus datos personales y los usamos solo para operar la tienda y atender tus pedidos.
        </p>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Datos que podemos recopilar</h2>
            <p>Nombre, correo electrónico, teléfono, dirección de envío, historial de pedidos y datos necesarios para brindarte atención.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Uso de la información</h2>
            <p>Usamos tus datos para crear pedidos, coordinar entregas, enviar confirmaciones y responder solicitudes de soporte.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Correos promocionales</h2>
            <p>Solo enviaremos promociones si te suscribes al boletín. Podrás solicitar dejar de recibirlas cuando lo necesites.</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-brand-black">Seguridad</h2>
            <p>No solicitamos contraseñas, claves privadas ni datos completos de tarjetas por chat o correo.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
