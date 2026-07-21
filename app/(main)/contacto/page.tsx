import Link from 'next/link';
import { Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Contáctanos | Calle Ocho Store',
  description: 'Contacta al equipo de Calle Ocho Store.',
};

export default function ContactoPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20">
          <MessageCircle className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold text-brand-black dark:text-white sm:text-4xl">
          Contáctanos
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Escríbenos para dudas sobre productos, tallas, pedidos, pagos, entregas o seguimiento. Te atendemos por los canales oficiales de Calle Ocho Store.
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          <article className="rounded-lg border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Mail className="mx-auto h-7 w-7 text-brand-blue" />
            <h2 className="font-semibold text-brand-black dark:text-white mb-2">Correo</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Para soporte general, pedidos y consultas detalladas.
            </p>
            <Button variant="outline" asChild>
              <Link href="mailto:ventas@calleochostore.com">Enviar correo</Link>
            </Button>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Instagram className="mx-auto h-7 w-7 text-brand-blue" />
            <h2 className="font-semibold text-brand-black dark:text-white mb-2">Instagram</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Novedades, publicaciones y mensajes directos.
            </p>
            <Button asChild>
              <Link href="https://www.instagram.com/calleochogt/" target="_blank" rel="noreferrer">
                Abrir Instagram
              </Link>
            </Button>

          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Facebook className="mx-auto h-7 w-7 text-brand-blue" />
            <h2 className="font-semibold text-brand-black dark:text-white mb-2">Facebook</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Visita la pagina oficial y revisa actualizaciones.
            </p>
            <Button variant="outline" asChild>
              <Link href="https://www.facebook.com/profile.php?id=100086381557070" target="_blank" rel="noreferrer">
                Abrir Facebook
              </Link>
            </Button>
          </article>
        </div>
      </section>
    </main>
  );
}
