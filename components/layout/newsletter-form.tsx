'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function NewsletterForm() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);

  const handleNewsletterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNewsletterStatus('loading');
    setNewsletterMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail, source: 'footer' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo completar la suscripción.');
      }

      setNewsletterEmail('');
      setNewsletterStatus('success');
      setNewsletterMessage('Listo. Te avisaremos de novedades y ofertas.');
    } catch (error) {
      setNewsletterStatus('error');
      setNewsletterMessage(error instanceof Error ? error.message : 'Intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
      <Input
        type="email"
        placeholder="Tu correo"
        value={newsletterEmail}
        onChange={(event) => setNewsletterEmail(event.target.value)}
        disabled={newsletterStatus === 'loading'}
        className="bg-white text-brand-black border-0 h-10 sm:h-11 text-sm"
        required
      />
      <Button
        type="submit"
        disabled={newsletterStatus === 'loading'}
        className="bg-white text-brand-black hover:bg-gray-200 font-semibold h-10 sm:h-11 text-sm"
      >
        {newsletterStatus === 'loading' && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Suscribirse
      </Button>
      {newsletterMessage && (
        <p
          className={`text-xs ${
            newsletterStatus === 'success' ? 'text-green-300' : 'text-red-300'
          }`}
        >
          {newsletterMessage}
        </p>
      )}
    </form>
  );
}
