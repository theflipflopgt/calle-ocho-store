import { createClient } from '@/lib/supabase/server';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import Link from 'next/link';

async function getDashboardStats() {
  const supabase = await createClient();

  // Get counts
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: totalCustomers },
    { count: pendingOrders },
    { count: lowStockVariants },
    { data: revenueData },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .lt('stock_quantity', 5)
      .gt('stock_quantity', 0),
    supabase
      .from('orders')
      .select('total')
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        created_at,
        profiles:user_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('product_variants')
      .select(`
        id,
        sku,
        stock_quantity,
        size_us,
        products:product_id (name),
        product_colors:product_color_id (color_name)
      `)
      .lt('stock_quantity', 5)
      .gt('stock_quantity', 0)
      .order('stock_quantity', { ascending: true })
      .limit(5),
  ]);

  const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

  return {
    totalProducts: totalProducts || 0,
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    pendingOrders: pendingOrders || 0,
    lowStockVariants: lowStockVariants || 0,
    totalRevenue,
    recentOrders: recentOrders || [],
    lowStockProducts: lowStockProducts || [],
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      name: 'Ingresos Totales',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subtext: null as string | null,
    },
    {
      name: 'Órdenes Totales',
      value: stats.totalOrders,
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtext: `${stats.pendingOrders} pendientes`,
    },
    {
      name: 'Productos',
      value: stats.totalProducts,
      icon: Package,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtext: stats.lowStockVariants > 0 ? `${stats.lowStockVariants} con stock bajo` : null,
    },
    {
      name: 'Clientes',
      value: stats.totalCustomers,
      icon: Users,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      subtext: null as string | null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al panel de administración</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-black">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.name}</p>
              </div>
            </div>
            {stat.subtext && (
              <p className="text-xs text-orange-600 mt-3 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stat.subtext}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-brand-black">Órdenes Recientes</h2>
            <Link
              href="/admin/ordenes"
              className="text-sm text-brand-blue hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No hay órdenes aún</p>
              </div>
            ) : (
              stats.recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/ordenes/${order.id}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-brand-black">
                      #{order.order_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.profiles?.full_name || order.profiles?.email || 'Cliente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-brand-black">
                      {formatPrice(Number(order.total))}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-brand-black">Stock Bajo</h2>
            <Link
              href="/admin/productos/inventario"
              className="text-sm text-brand-blue hover:underline"
            >
              Ver inventario
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No hay productos con stock bajo</p>
              </div>
            ) : (
              stats.lowStockProducts.map((variant: any) => (
                <div
                  key={variant.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-brand-black">
                      {variant.products?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {variant.product_colors?.color_name} - Talla {variant.size_us}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      {variant.stock_quantity} unidades
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-brand-black mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/productos/nuevo"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-colors"
          >
            <Package className="h-6 w-6 text-brand-blue mb-2" />
            <span className="text-sm font-medium text-brand-black">Nuevo Producto</span>
          </Link>
          <Link
            href="/admin/ordenes?status=pending"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-colors"
          >
            <Clock className="h-6 w-6 text-brand-blue mb-2" />
            <span className="text-sm font-medium text-brand-black">Órdenes Pendientes</span>
          </Link>
          <Link
            href="/admin/cupones/nuevo"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-colors"
          >
            <DollarSign className="h-6 w-6 text-brand-blue mb-2" />
            <span className="text-sm font-medium text-brand-black">Crear Cupón</span>
          </Link>
          <Link
            href="/admin/marcas/nuevo"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-brand-blue mb-2" />
            <span className="text-sm font-medium text-brand-black">Nueva Marca</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
