import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { Search, Filter, AlertTriangle, Package, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { InventoryImportPanel } from './inventory-import-panel';
import { InventoryProductList } from './inventory-product-list';

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

async function getRecentMovements(auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>) {
  if (!auth.isAdmin && !auth.isWarehouse) return [];
  const db = (createAdminClient() || auth.supabase) as any;
  const { data, error } = await db
    .from('inventory_movements')
    .select(`
      id, movement_type, quantity_delta, balance_after, reason, created_at,
      variant:variant_id(sku, size_us, products:product_id(name)),
      order:order_id(order_number)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching inventory movements:', error);
    return [];
  }
  return data || [];
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const filters = await searchParams;
  const auth = await requireAuthenticatedUser();
  const variants = await getInventory(filters);
  const movements = await getRecentMovements(auth);
  const groupedProducts = Array.from(
    variants.reduce((groups: Map<string, any>, variant: any) => {
      const productId = variant.products?.id || `deleted-${variant.id}`;
      const current = groups.get(productId) || {
        id: productId,
        product: variant.products,
        variants: [],
      };
      current.variants.push(variant);
      groups.set(productId, current);
      return groups;
    }, new Map<string, any>()).values()
  ).map((group: any) => ({
    ...group,
    variants: group.variants.sort(
      (a: any, b: any) =>
        String(a.product_colors?.color_name || '').localeCompare(
          String(b.product_colors?.color_name || ''),
          'es'
        ) || Number(a.size_us || 0) - Number(b.size_us || 0)
    ),
  }));

  const stats = {
    totalProducts: groupedProducts.length,
    totalVariants: variants.length,
    outOfStock: variants.filter((v: any) => v.stock_quantity === 0).length,
    lowStock: variants.filter((v: any) => v.stock_quantity > 0 && v.stock_quantity < 10).length,
    inStock: variants.filter((v: any) => v.stock_quantity >= 10).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Inventario</h1>
          <p className="text-gray-600 mt-1">Productos agrupados con existencias por color y talla.</p>
        </div>
        {(auth.isAdmin || auth.isWarehouse) && (
          <Link href="/api/admin/exports/inventory">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Exportar inventario actual
            </Button>
          </Link>
        )}
      </div>

      {auth.canManageProducts && <InventoryImportPanel />}

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
              <p className="text-2xl font-bold text-brand-black">{stats.totalProducts}</p>
              <p className="text-sm text-gray-600">Productos</p>
              <p className="text-xs text-gray-500">{stats.totalVariants} tallas</p>
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

      {/* Inventory grouped by product */}
      <InventoryProductList groups={groupedProducts} isAdmin={auth.isAdmin} />

      {(auth.isAdmin || auth.isWarehouse) && (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-brand-black">Movimientos recientes</h2>
            <p className="text-sm text-gray-600">Últimos 50 cambios de existencias registrados por el servidor.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Cambio</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-left">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aún no hay movimientos registrados.</td></tr>
                ) : movements.map((movement: any) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap px-4 py-3">{new Date(movement.created_at).toLocaleString('es-GT', { timeZone: 'America/Guatemala' })}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{movement.variant?.products?.name || 'Producto'}</p>
                      <p className="text-xs text-gray-500">{movement.variant?.sku} · US {movement.variant?.size_us}</p>
                    </td>
                    <td className="px-4 py-3">{movement.movement_type}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${movement.quantity_delta > 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {movement.quantity_delta > 0 ? '+' : ''}{movement.quantity_delta}
                    </td>
                    <td className="px-4 py-3 text-right">{movement.balance_after}</td>
                    <td className="px-4 py-3">
                      {movement.order?.order_number || movement.reason || 'Sin referencia'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
