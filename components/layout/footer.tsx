'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Loader2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
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
    <footer className="bg-brand-black text-white mt-12 sm:mt-16 md:mt-20">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
          {/* Shop */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wider">Comprar</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/hombre" className="hover:text-white transition-colors">
                  Hombre
                </Link>
              </li>
              <li>
                <Link href="/mujer" className="hover:text-white transition-colors">
                  Mujer
                </Link>
              </li>
              <li>
                <Link href="/ninos" className="hover:text-white transition-colors">
                  Niños
                </Link>
              </li>
              <li>
                <Link href="/marcas" className="hover:text-white transition-colors">
                  Marcas
                </Link>
              </li>
              <li>
                <Link href="/ofertas" className="hover:text-white transition-colors">
                  Ofertas
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wider">Ayuda</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/seguimiento" className="hover:text-white transition-colors">
                  Estado del pedido
                </Link>
              </li>
              <li>
                <Link href="/envios" className="hover:text-white transition-colors">
                  Envío y entrega
                </Link>
              </li>
              <li>
                <Link href="/devoluciones" className="hover:text-white transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition-colors">
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wider">Sobre nosotros</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/nosotros" className="hover:text-white transition-colors">
                  Nuestra historia
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-white transition-colors">
                  Términos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wider">Boletín</h4>
            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
              Recibe ofertas exclusivas y novedades
            </p>
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
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-5 sm:gap-6">
              <Link
                href="https://facebook.com"
                target="_blank"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:info@calleochostore.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-center md:text-right">
              <p>&copy; 2025 Calle Ocho Store. Guatemala.</p>
              <p className="text-[10px] sm:text-xs mt-1">
                Desarrollada por{' '}
                <Link
                  href="https://www.solucionesweb-2025.com"
                  target="_blank"
                  className="hover:text-white transition-colors"
                >
                  Soluciones Web 2025
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
