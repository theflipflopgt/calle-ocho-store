import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/constants/business';

export const metadata = {
  title: 'Contáctanos | Calle Ocho Store',
  description: 'Contacta a Calle Ocho Store para resolver dudas sobre productos, pedidos y entregas.',
};

export default function ContactoPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold text-brand-black sm:text-4xl">
          Contáctanos
        </h1>
        <p className="mb-8 text-gray-600">
          Estamos para ayudarte con tallas, disponibilidad, pedidos, envíos y cambios.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`}
            target="_blank"
            className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue"
          >
            <MessageCircle className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-1 font-semibold text-brand-black">WhatsApp</h2>
            <p className="text-sm text-gray-600">Escríbenos para atención rápida.</p>
          </Link>

          <Link
            href="mailto:info@calleochostore.com"
            className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue"
          >
            <Mail className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-1 font-semibold text-brand-black">Correo electrónico</h2>
            <p className="text-sm text-gray-600">info@calleochostore.com</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
