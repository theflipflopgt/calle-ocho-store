'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail } from 'lucide-react';
import { NewsletterForm } from '@/components/newsletter/newsletter-form';

export function Footer() {
  return (
    <footer className="bg-brand-black dark:bg-gray-950 text-white mt-12 sm:mt-16 md:mt-20">
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
                  Estado del Pedido
                </Link>
              </li>
              <li>
                <Link href="/envios" className="hover:text-white transition-colors">
                  Envío y Entrega
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
            <h4 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wider">Sobre Nosotros</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/nosotros" className="hover:text-white transition-colors">
                  Nuestra Historia
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-white transition-colors">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
              Recibe ofertas exclusivas y novedades
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-5 sm:gap-6">
              <Link
                href="https://www.facebook.com/profile.php?id=100086381557070"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/calleochogt/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:ventas@calleochostore.com"
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
