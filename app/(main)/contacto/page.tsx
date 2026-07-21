import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Contáctanos | Calle Ocho Store',
  description: 'Contacta al equipo de Calle Ocho Store.',
};

export default function ContactoPage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-3xl">
        <MessageCircle className="h-10 w-10 text-brand-blue mb-4" />
        <h1 className="text-3xl font-bold text-brand-black dark:text-white mb-4">
          Contáctanos
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Escríbenos para dudas sobre productos, tallas, pedidos, pagos o entregas.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <Mail className="h-6 w-6 text-brand-blue mb-3" />
            <h2 className="font-semibold text-brand-black dark:text-white mb-2">Correo</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Para soporte general y pedidos.
            </p>
            <Button variant="outline" asChild>
              <Link href="mailto:ventas@calleochostore.com">Enviar correo</Link>
            </Button>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <MessageCircle className="h-6 w-6 text-brand-blue mb-3" />
            <h2 className="font-semibold text-brand-black dark:text-white mb-2">WhatsApp</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Atención rápida para compras y seguimiento.
            </p>
            <Button asChild>
              <Link href="https://wa.me/" target="_blank">Abrir WhatsApp</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
