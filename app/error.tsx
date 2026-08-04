'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application error', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="container mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-brand-black">No pudimos cargar esta sección</h1>
      <p className="mt-3 text-gray-600">Intenta nuevamente. Tu carrito y tus datos no se eliminaron.</p>
      <Button className="mt-7" onClick={reset}>Intentar de nuevo</Button>
    </main>
  );
}
