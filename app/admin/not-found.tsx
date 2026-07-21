import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-brand-black">Página de admin no encontrada</h1>
        <p className="mt-2 text-gray-600">
          Esta sección no existe todavía, pero el panel sigue funcionando. Puedes volver al dashboard sin perder tu sesión.
        </p>
        <Button asChild className="mt-6 bg-brand-blue hover:bg-brand-blue/90">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
