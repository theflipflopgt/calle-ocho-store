import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, Globe, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteBrandButton } from './delete-button';

async function getBrands() {
  const supabase = await createClient();

  const { data: brands, error } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }

  return brands;
}

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Marcas</h1>
          <p className="text-gray-600 mt-1">Gestiona las marcas de tenis</p>
        </div>
        <Link href="/admin/marcas/nuevo" className="w-full sm:w-auto">
          <Button className="bg-brand-blue hover:bg-brand-blue/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Marca
          </Button>
        </Link>
      </div>

      {/* Brands - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {brands.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Layers className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No hay marcas registradas.{' '}
            <Link href="/admin/marcas/nuevo" className="text-brand-blue hover:underline">
              Crear la primera marca
            </Link></p>
          </div>
        ) : (
          brands.map((brand) => (
            <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-14 h-14 object-contain rounded-lg border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 font-bold text-xl">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-brand-black">{brand.name}</p>
                      <p className="text-sm text-gray-600">{brand.country || 'Sin país'}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        brand.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {brand.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {brand.website_url && (
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-blue flex items-center gap-1 mt-1"
                    >
                      <Globe className="h-3 w-3" />
                      Sitio web
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{brand.slug}</code>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/marcas/${brand.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Brands Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marca
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                País
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay marcas registradas.{' '}
                  <Link href="/admin/marcas/nuevo" className="text-brand-blue hover:underline">
                    Crear la primera marca
                  </Link></p>
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="w-10 h-10 object-contain rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-sm">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-brand-black">{brand.name}</p>
                        {brand.website_url && (
                          <a
                            href={brand.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-brand-blue flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Sitio web
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {brand.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {brand.country || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        brand.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {brand.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/marcas/${brand.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
