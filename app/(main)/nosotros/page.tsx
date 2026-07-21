export const metadata = {
  title: 'Nuestra Historia | Calle Ocho Store',
  description: 'Conoce la historia de Calle Ocho Store.',
};

export default function NosotrosPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Nuestra Historia
        </h1>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Calle Ocho Store nace como una tienda enfocada en calzado, sneakers y estilo
            urbano para clientes que buscan productos auténticos, cómodos y listos para el
            día a día.
          </p>
          <p>
            Nuestro objetivo es facilitar la compra de calzado con información clara de
            tallas, disponibilidad, precios y atención personalizada.
          </p>
        </div>
      </div>
    </main>
  );
}
