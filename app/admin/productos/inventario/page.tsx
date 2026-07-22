import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { Search, Filter, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface InventoryPageProps {
  searchParams: Promise<{ stock?: string; q?: string }>;
}

async function getInventory(filters: { stock?: string; q?: string }) {
  const auth = await requireAuthenticatedUser();
  if (!auth.canViewInventory) return [];

  const admin = createAdminClient();
  const supabase = (admin || auth.supabase) as any;

  let query = supabase
    .from('product_variants')
    .select(`
      *,
      products:product_id (id, name, slug, sku, status),
      product_colors:product_color_id (color_name, color_code)
    `)
    .order('stock_quantity', { ascending: true });

  if (filters.stock === 'low') {
    query = query.lt('stock_quantity', 10).gt('stock_quantity', 0);
  } else if (filters.stock === 'out') {
    query = query.eq('stock_quantity', 0);
  } else if (filters.stock === 'ok') {
    query = query.gte('stock_quantity', 10);
  }

  const { data: variants, error } = await query;

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }

  // Filter by search query on product name
  if (filters.q) {
    const searchLower = filters.q.toLowerCase();
    return variants.filter((v: any) =>
      v.products?.name?.toLowerCase().includes(searchLower) ||
      v.sku?.toLowerCase().includes(searchLower)
    );
  }

  return variants;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const filters = await searchParams;
  const variants = await getInventory(filters);

  const stats = {
    total: variants.length,
    outOfStock: variants.filter((v: any) => v.stock_quantity === 0).length,
    lowStock: variants.filter((v: any) => v.stock_quantity > 0 && v.stock_quantity < 10).length,
    inStock: variants.filter((v: any) => v.stock_quantity >= 10).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Inventario</h1>
        <p className="text-gray-600 mt-1">Control de stock por variante</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/productos/inventario"
          className={`bg-white rounded-xl border p-4 ${
            !filters.stock ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/productos/inventario?stock=out"
          className={`bg-white rounded-xl border p-4 ${
            filters.stock === 'out' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.outOfStock}</p>
              <p className="text-sm text-gray-600">Agotados</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/productos/inventario?stock=low"
          className={`bg-white rounded-xl border p-4 ${
            filters.stock === 'low' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.lowStock}</p>
              <p className="text-sm text-gray-600">Stock Bajo</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/productos/inventario?stock=ok"
          className={`bg-white rounded-xl border p-4 ${
            filters.stock === 'ok' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.inStock}</p>
              <p className="text-sm text-gray-600">En Stock</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                name="q"
                placeholder="Buscar por producto o SKU..."
                defaultValue={filters.q}
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Talla
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay variantes de productos</p>
                  </td>
                </tr>
              ) : (
                variants.map((variant: any) => {
                  const isOutOfStock = variant.stock_quantity === 0;
                  const isLowStock = variant.stock_quantity > 0 && variant.stock_quantity < variant.low_stock_threshold;

                  return (
                    <tr key={variant.id} className={`hover:bg-gray-50 ${isOutOfStock ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="font-medium text-brand-black">
                          {variant.products?.name || 'Producto eliminado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: variant.product_colors?.color_code }}
                          />
                          <span className="text-sm">{variant.product_colors?.color_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <span className="font-medium">US {variant.size_us}</span>
                          <span className="text-gray-500 ml-2">EU {variant.size_eu}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {variant.sku}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-lg font-bold ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}
                        >
                          {variant.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : isLowStock
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado' : isLowStock ? 'Stock Bajo' : 'Disponible'}
                        </span>
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
