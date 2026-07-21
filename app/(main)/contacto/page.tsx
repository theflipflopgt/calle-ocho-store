import Image from 'next/image';
import Link from 'next/link';
import { Mail, MessageCircle, PhoneCall } from 'lucide-react';
import { BUSINESS_WHATSAPP_DISPLAY, BUSINESS_WHATSAPP_NUMBER } from '@/lib/constants/business';

export const metadata = {
  title: 'Contáctanos | Calle Ocho Store',
  description: 'Contacta a Calle Ocho Store para resolver dudas sobre productos, pedidos y entregas.',
};

export default function ContactoPage() {
  return (
    <main>
      <section className="relative min-h-[340px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1800&auto=format&fit=crop"
          alt="Atención de Calle Ocho Store"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[340px] items-center px-4 text-white">
          <div className="max-w-2xl">
            <PhoneCall className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Contáctanos</h1>
            <p className="mt-4 text-lg text-white/90">
              Estamos para ayudarte con tallas, disponibilidad, pedidos, envíos y cambios.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`}
            target="_blank"
            className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue"
          >
            <MessageCircle className="mb-3 h-6 w-6 text-brand-blue" />
            <h2 className="mb-1 font-semibold text-brand-black">WhatsApp</h2>
            <p className="text-sm text-gray-600">{BUSINESS_WHATSAPP_DISPLAY}</p>
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
