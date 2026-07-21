import { createClient } from '@/lib/supabase/server';
import { Search, Filter, User, Mail, Phone, ShoppingBag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/currency';
import Link from 'next/link';

interface CustomersPageProps {
  searchParams: Promise<{ q?: string; role?: string }>;
}

async function getCustomers(filters: { q?: string; role?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select(`
      *,
      orders:orders(count),
      total_spent:orders(total)
    `)
    .order('created_at', { ascending: false });

  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  if (filters.q) {
    query = query.or(`full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`);
  }

  const { data: customers, error } = await query;

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  // Calculate total spent per customer
  return customers.map((customer: any) => ({
    ...customer,
    order_count: customer.orders?.[0]?.count || 0,
    total_spent: customer.total_spent?.reduce(
      (sum: number, order: any) => sum + Number(order.total || 0),
      0
    ) || 0,
  }));
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const filters = await searchParams;
  const customers = await getCustomers(filters);

  const stats = {
    total: customers.length,
    admins: customers.filter((c: any) => c.role === 'admin').length,
    withOrders: customers.filter((c: any) => c.order_count > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Clientes</h1>
        <p className="text-gray-600 mt-1">
          {stats.total} usuarios registrados • {stats.withOrders} han comprado
        </p>
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
                placeholder="Buscar por nombre o email..."
                defaultValue={filters.q}
                className="pl-10"
              />
            </div>
          </div>

          <select
            name="role"
            defaultValue={filters.role}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">Todos los roles</option>
            <option value="customer">Clientes</option>
            <option value="admin">Administradores</option>
          </select>

          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </form>
      </div>

      {/* Customers - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No hay clientes {filters.q ? 'con ese criterio' : 'registrados'}</p>
          </div>
        ) : (
          customers.map((customer: any) => (
            <div key={customer.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                {customer.avatar_url ? (
                  <img
                    src={customer.avatar_url}
                    alt={customer.full_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-lg">
                      {customer.full_name?.charAt(0) || customer.email?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-brand-black">
                        {customer.full_name || 'Sin nombre'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{customer.email}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        customer.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {customer.role === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </div>
                  {customer.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Órdenes</p>
                  {customer.order_count > 0 ? (
                    <Link
                      href={`/admin/ordenes?customer=${customer.id}`}
                      className="text-sm font-medium text-brand-blue"
                    >
                      {customer.order_count}
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-500">0</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gastado</p>
                  <p className="text-sm font-medium text-brand-black">
                    {customer.total_spent > 0 ? formatPrice(customer.total_spent) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registro</p>
                  <p className="text-sm text-gray-600">
                    {new Date(customer.created_at).toLocaleDateString('es-GT', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customers Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Órdenes
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gastado
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay clientes {filters.q ? 'con ese criterio' : 'registrados'}</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt={customer.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {customer.full_name?.charAt(0) || customer.email?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-brand-black">
                            {customer.full_name || 'Sin nombre'}
                          </p>
                          {customer.preferred_size_us && (
                            <p className="text-xs text-gray-500">
                              Talla preferida: {customer.preferred_size_us}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.order_count > 0 ? (
                        <Link
                          href={`/admin/ordenes?customer=${customer.id}`}
                          className="flex items-center gap-1 text-brand-blue hover:underline"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          {customer.order_count} {customer.order_count === 1 ? 'orden' : 'órdenes'}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Sin órdenes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-brand-black">
                        {customer.total_spent > 0
                          ? formatPrice(customer.total_spent)
                          : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          customer.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {customer.role === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(customer.created_at).toLocaleDateString('es-GT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
