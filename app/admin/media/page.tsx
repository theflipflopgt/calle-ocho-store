import Link from 'next/link';
import { Package, Video } from 'lucide-react';
import { MediaUploader } from './media-uploader';

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Media</h1>
        <p className="mt-1 text-gray-600">Carga imágenes y videos y usa la URL segura en la tienda.</p>
      </div>

      <MediaUploader />

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/inicio" className="rounded-lg border border-gray-200 bg-white p-5 hover:border-brand-blue">
          <Video className="mb-3 h-6 w-6 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Contenido del inicio</h2>
          <p className="mt-1 text-sm text-gray-600">Asigna videos, imágenes de respaldo y categorías.</p>
        </Link>
        <Link href="/admin/productos" className="rounded-lg border border-gray-200 bg-white p-5 hover:border-brand-blue">
          <Package className="mb-3 h-6 w-6 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Productos</h2>
          <p className="mt-1 text-sm text-gray-600">Pega la URL cargada en el color correspondiente.</p>
        </Link>
      </div>
    </div>
  );
}
