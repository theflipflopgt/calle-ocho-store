import Image from 'next/image';
import { Bell, LockKeyhole, MailCheck, UserCheck } from 'lucide-react';
import { getHomeContent } from '@/lib/home-content';

export const metadata = {
  title: 'Política de privacidad | Calle Ocho Store',
  description: 'Política de privacidad y uso de datos de Calle Ocho Store.',
};

export default async function PrivacidadPage() {
  const homeContent = await getHomeContent();
  const sections = [
    ['Datos que podemos recopilar', 'Nombre, correo electrónico, teléfono, dirección de envío, historial de pedidos y datos necesarios para brindarte atención.', UserCheck],
    ['Uso de la información', 'Usamos tus datos para crear pedidos, coordinar entregas, enviar confirmaciones y responder solicitudes de soporte.', MailCheck],
    ['Correos promocionales', 'Solo enviaremos promociones si te suscribes al boletín. Podrás solicitar dejar de recibirlas cuando lo necesites.', Bell],
    ['Seguridad', 'No solicitamos contraseñas, claves privadas ni datos completos de tarjetas por chat o correo.', LockKeyhole],
  ] as const;

  return (
    <main>
      <section className="relative min-h-[320px] overflow-hidden">
        <Image
          src={homeContent.footerPages.privacidad.image}
          alt={homeContent.footerPages.privacidad.alt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[320px] items-center px-4 text-white">
          <div className="max-w-2xl">
            <LockKeyhole className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Política de privacidad</h1>
            <p className="mt-4 text-lg text-white/90">
              Cuidamos tus datos personales y los usamos solo para operar la tienda y atender tus pedidos.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map(([title, text, Icon]) => (
            <div key={title} className="rounded-lg border border-gray-200 bg-white p-5">
              <Icon className="mb-3 h-6 w-6 text-brand-blue" />
              <h2 className="mb-2 text-lg font-semibold text-brand-black">{title}</h2>
              <p className="text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
