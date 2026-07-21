import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, GripVertical, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteCategoryButton } from './delete-button';

async function getCategories() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Categorías</h1>
          <p className="text-gray-600 mt-1">Organiza los productos por categoría</p>
        </div>
        <Link href="/admin/categorias/nuevo" className="w-full sm:w-auto">
          <Button className="bg-brand-blue hover:bg-brand-blue/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      {/* Categories - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No hay categorías registradas.{' '}
            <Link href="/admin/categorias/nuevo" className="text-brand-blue hover:underline">
              Crear la primera categoría
            </Link></p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 font-bold text-xl">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-brand-black">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-gray-400">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs">#{category.display_order}</span>
                  </div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/categorias/${category.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Categories Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Orden
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
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
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay categorías registradas.{' '}
                  <Link href="/admin/categorias/nuevo" className="text-brand-blue hover:underline">
                    Crear la primera categoría
                  </Link></p>
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm">{category.display_order}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-sm">
                            {category.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-brand-black">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/categorias/${category.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
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
