import Link from 'next/link';
import { ImageIcon, Upload, Video, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Media</h1>
        <p className="mt-1 text-gray-600">
          Gestiona imágenes, videos y enlaces visuales usados en la tienda.
        </p>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Wand2 className="mt-0.5 h-5 w-5 text-brand-blue" />
          <div>
            <h2 className="font-semibold text-brand-black">Carga directa próximamente</h2>
            <p className="mt-1 text-sm text-gray-700">
              Por ahora puedes cambiar imágenes y videos desde Inicio, Productos y Marcas pegando URLs de Cloudinary,
              Supabase Storage u otra fuente permitida.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/inicio"
          className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue hover:bg-blue-50"
        >
          <Video className="mb-3 h-6 w-6 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Videos del inicio</h2>
          <p className="mt-1 text-sm text-gray-600">Cambia el video principal, video móvil e imagen de respaldo.</p>
        </Link>

        <Link
          href="/admin/productos"
          className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue hover:bg-blue-50"
        >
          <ImageIcon className="mb-3 h-6 w-6 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Imágenes de productos</h2>
          <p className="mt-1 text-sm text-gray-600">Edita imágenes por color dentro de cada producto.</p>
        </Link>

        <Link
          href="/admin/marcas"
          className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue hover:bg-blue-50"
        >
          <Upload className="mb-3 h-6 w-6 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Logos de marcas</h2>
          <p className="mt-1 text-sm text-gray-600">Actualiza los logos y datos de tus marcas.</p>
        </Link>
      </div>

      <Button asChild className="bg-brand-blue hover:bg-brand-blue/90">
        <Link href="/admin/inicio">Editar inicio</Link>
      </Button>
    </div>
  );
}
