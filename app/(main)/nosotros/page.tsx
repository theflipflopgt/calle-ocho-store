export const metadata = {
  title: 'Nuestra historia | Calle Ocho Store',
  description: 'Conoce la historia y el propósito de Calle Ocho Store.',
};

export default function NosotrosPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Nuestra historia
        </h1>
        <p className="mb-6 text-gray-600">
          Calle Ocho Store nace para acercar calzado urbano, cómodo y auténtico a quienes buscan estilo en cada paso.
        </p>
        <div className="space-y-5 text-gray-700">
          <p>
            Somos una tienda enfocada en tenis y sneakers de marcas reconocidas, con una experiencia de compra sencilla,
            clara y pensada para Guatemala.
          </p>
          <p>
            Nuestro objetivo es ayudarte a encontrar el par correcto, con información visible sobre talla, disponibilidad,
            precio y estado del pedido.
          </p>
          <p>
            Seguimos construyendo una tienda más ordenada, segura y fácil de administrar, para que cada compra se sienta
            confiable de inicio a fin.
          </p>
        </div>
      </section>
    </main>
  );
}
