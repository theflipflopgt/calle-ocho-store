import Link from 'next/link';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Preferencias de correo | Calle Ocho Store',
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === 'success';

  return (
    <main className="container mx-auto max-w-xl px-4 py-20 text-center">
      {success ? (
        <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-green-600" />
      ) : (
        <CircleAlert className="mx-auto mb-5 h-12 w-12 text-amber-600" />
      )}
      <h1 className="text-2xl font-bold text-brand-black">
        {success ? 'Suscripción cancelada' : 'No pudimos completar la solicitud'}
      </h1>
      <p className="mt-3 text-gray-600">
        {success
          ? 'Tu correo ya no recibirá mensajes promocionales de Calle Ocho Store.'
          : 'El enlace puede haber vencido o ser inválido. Escríbenos para actualizar tus preferencias.'}
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </main>
  );
}
