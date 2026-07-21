import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MainNotFound() {
  return (
    <main className="container mx-auto px-4 py-14 sm:py-20">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-6 text-[96px] font-bold leading-none text-brand-black sm:text-[132px]">
          4<span className="text-brand-blue">0</span>4
        </div>
        <h1 className="text-3xl font-bold text-brand-black sm:text-4xl">
          Página no encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          La página que buscas no existe o fue movida. Tu sesión y el panel no se ven afectados.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-brand-black hover:bg-gray-800">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/buscar">
              <Search className="mr-2 h-4 w-4" />
              Buscar productos
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/hombre">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver catálogo
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
