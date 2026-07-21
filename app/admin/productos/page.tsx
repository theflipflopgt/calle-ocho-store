import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, Eye, Search, Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/currency';
import { DeleteProductButton } from './delete-button';

interface ProductsPageProps {
  searchParams: Promise<{ status?: string; brand?: string; category?: string; q?: string }>;
}

async function getProducts(filters: { status?: string; brand?: string; category?: string; q?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      *,
      brands:brand_id (id, name),
      categories:category_id (id, name),
      product_colors (
        id,
        color_name,
        product_color_images (image_url, display_order)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.brand) {
    query = query.eq('brand_id', filters.brand);
  }

  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters.q) {
    query = query.ilike('name', `%${filters.q}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products;
}

async function getBrandsAndCategories() {
  const supabase = await createClient();

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return { brands: brands || [], categories: categories || [] };
}

const statusLabels: Record<string, { label: string; class: string }> = {
  draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-600' },
  active: { label: 'Activo', class: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactivo', class: 'bg-yellow-100 text-yellow-800' },
  discontinued: { label: 'Descontinuado', class: 'bg-red-100 text-red-800' },
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const filters = await searchParams;
  const [products, { brands, categories }] = await Promise.all([
    getProducts(filters),
    getBrandsAndCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Productos</h1>
          <p className="text-gray-600 mt-1">{products.length} productos encontrados</p>
        </div>
        <Link href="/admin/productos/nuevo" className="w-full sm:w-auto">
          <Button className="bg-brand-blue hover:bg-brand-blue/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                name="q"
                placeholder="Buscar productos..."
                defaultValue={filters.q}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            name="status"
            defaultValue={filters.status}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="draft">Borradores</option>
            <option value="inactive">Inactivos</option>
            <option value="discontinued">Descontinuados</option>
          </select>

          {/* Brand Filter */}
          <select
            name="brand"
            defaultValue={filters.brand}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">Todas las marcas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            name="category"
            defaultValue={filters.category}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </form>
      </div>

      {/* Products - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No hay productos.{' '}
            <Link href="/admin/productos/nuevo" className="text-brand-blue hover:underline">
              Crear el primer producto
            </Link></p>
          </div>
        ) : (
          products.map((product: any) => {
            const mainImage = product.product_colors?.[0]?.product_color_images?.find(
              (img: any) => img.display_order === 0
            )?.image_url;

            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex gap-4">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-500 text-xs">Sin img</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-brand-black truncate">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.brands?.name || '-'}</p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          statusLabels[product.status]?.class || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {statusLabels[product.status]?.label || product.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-brand-black">
                          {formatPrice(Number(product.base_price))}
                        </p>
                        {product.compare_at_price && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(Number(product.compare_at_price))}
                          </p>
                        )}
                      </div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {product.sku}
                      </code>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {product.product_colors?.length || 0} colores
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/productos/${product.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <Link href={`/producto/${product.slug}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteProductButton productId={product.id} productName={product.name} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marca
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay productos.{' '}
                    <Link href="/admin/productos/nuevo" className="text-brand-blue hover:underline">
                      Crear el primer producto
                    </Link></p>
                  </td>
                </tr>
              ) : (
                products.map((product: any) => {
                  const mainImage = product.product_colors?.[0]?.product_color_images?.find(
                    (img: any) => img.display_order === 0
                  )?.image_url;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Sin img</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-brand-black">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {product.product_colors?.length || 0} colores
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {product.sku}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.brands?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-brand-black">
                            {formatPrice(Number(product.base_price))}
                          </p>
                          {product.compare_at_price && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(Number(product.compare_at_price))}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            statusLabels[product.status]?.class || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabels[product.status]?.label || product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/productos/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/producto/${product.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteProductButton productId={product.id} productName={product.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
