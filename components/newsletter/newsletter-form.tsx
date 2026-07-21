'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(result.error || 'No se pudo guardar tu correo.');
        return;
      }

      setStatus('success');
      setMessage(result.message || 'Listo, quedaste suscrito.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('No se pudo conectar. Intenta nuevamente.');
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="Tu correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="bg-white text-brand-black border-0 h-10 sm:h-11 text-sm"
        required
      />
      <Button
        className="bg-white text-brand-black hover:bg-gray-200 font-semibold h-10 sm:h-11 text-sm"
        disabled={status === 'loading'}
        type="submit"
      >
        {status === 'loading' ? 'Guardando...' : 'Suscribirse'}
      </Button>
      {message && (
        <p className={status === 'success' ? 'text-xs text-green-300' : 'text-xs text-red-300'}>
          {message}
        </p>
      )}
      <p className="text-[11px] leading-4 text-gray-500">
        Al suscribirte aceptas recibir novedades y promociones de Calle Ocho Store.
      </p>
    </form>
  );
}
