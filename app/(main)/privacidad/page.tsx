export const metadata = {
  title: 'Política de Privacidad | Calle Ocho Store',
  description: 'Política de privacidad de Calle Ocho Store.',
};

export default function PrivacidadPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Política de Privacidad
        </h1>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Usamos tus datos para procesar pedidos, coordinar entregas, responder consultas
            y mejorar la experiencia de compra.
          </p>
          <p>
            No solicitamos ni almacenamos datos completos de tarjetas bancarias dentro de la
            base de datos de Calle Ocho Store.
          </p>
          <p>
            Las claves, tokens y datos sensibles se manejan como variables privadas del
            servidor y no deben exponerse en el navegador.
          </p>
        </div>
      </div>
    </main>
  );
}
