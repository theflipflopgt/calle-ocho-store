import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-brand-black">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-[120px] sm:text-[160px] font-bold text-white leading-none">
            4<span className="text-brand-blue">0</span>4
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Página no encontrada
        </h1>
        <p className="text-gray-300 mb-8 text-sm sm:text-base">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="h-12 bg-white hover:bg-gray-100 text-brand-black"
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Ir al Inicio
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white text-white hover:bg-white hover:text-brand-black"
            asChild
          >
            <Link href="/buscar">
              <Search className="w-5 h-5 mr-2" />
              Buscar Productos
            </Link>
          </Button>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-300 mb-4">
            O explora nuestras categorías:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/hombre"
              className="px-4 py-2 bg-transparent border border-gray-600 rounded-full text-sm font-medium text-white hover:border-white transition-colors"
            >
              Hombre
            </Link>
            <Link
              href="/mujer"
              className="px-4 py-2 bg-transparent border border-gray-600 rounded-full text-sm font-medium text-white hover:border-white transition-colors"
            >
              Mujer
            </Link>
            <Link
              href="/ninos"
              className="px-4 py-2 bg-transparent border border-gray-600 rounded-full text-sm font-medium text-white hover:border-white transition-colors"
            >
              Niños
            </Link>
            <Link
              href="/ofertas"
              className="px-4 py-2 bg-transparent border border-brand-red rounded-full text-sm font-medium text-brand-red hover:border-white hover:text-white transition-colors"
            >
              Ofertas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
