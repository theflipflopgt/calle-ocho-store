import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, Copy, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/currency';
import { DeleteCouponButton } from './delete-button';

async function getCoupons() {
  const supabase = await createClient();

  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }

  return coupons;
}

export default async function CouponsPage() {
  const coupons = await getCoupons();

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Cupones</h1>
          <p className="text-gray-600 mt-1">Gestiona códigos de descuento</p>
        </div>
        <Link href="/admin/cupones/nuevo" className="w-full sm:w-auto">
          <Button className="bg-brand-blue hover:bg-brand-blue/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cupón
          </Button>
        </Link>
      </div>

      {/* Coupons - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {coupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Ticket className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No hay cupones.{' '}
            <Link href="/admin/cupones/nuevo" className="text-brand-blue hover:underline">
              Crear el primer cupón
            </Link></p>
          </div>
        ) : (
          coupons.map((coupon) => {
            const isExpired = coupon.valid_until && new Date(coupon.valid_until) < now;
            const isMaxedOut = coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses;
            const isActive = coupon.is_active && !isExpired && !isMaxedOut;

            return (
              <div key={coupon.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-bold">
                        {coupon.code}
                      </code>
                      <button
                        className="text-gray-400 hover:text-brand-blue"
                        title="Copiar código"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{coupon.description}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : isExpired
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isActive ? 'Activo' : isExpired ? 'Expirado' : isMaxedOut ? 'Agotado' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Descuento</p>
                    <p className="text-sm font-bold text-brand-black">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : formatPrice(Number(coupon.discount_value))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Usos</p>
                    <p className="text-sm font-medium text-brand-black">
                      {coupon.current_uses || 0}
                      {coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vigencia</p>
                    <p className="text-sm text-gray-600">
                      {coupon.valid_until
                        ? new Date(coupon.valid_until).toLocaleDateString('es-GT', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'Sin límite'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Link href={`/admin/cupones/${coupon.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <DeleteCouponButton couponId={coupon.id} couponCode={coupon.code} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Coupons Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usos
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vigencia
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
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Ticket className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay cupones.{' '}
                    <Link href="/admin/cupones/nuevo" className="text-brand-blue hover:underline">
                      Crear el primer cupón
                    </Link></p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = coupon.valid_until && new Date(coupon.valid_until) < now;
                  const isMaxedOut = coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses;
                  const isActive = coupon.is_active && !isExpired && !isMaxedOut;

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-medium">
                            {coupon.code}
                          </code>
                          <button
                            className="text-gray-400 hover:text-brand-blue"
                            title="Copiar código"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-black">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}%`
                            : formatPrice(Number(coupon.discount_value))}
                        </p>
                        {coupon.min_purchase_amount && (
                          <p className="text-xs text-gray-500">
                            Mín: {formatPrice(Number(coupon.min_purchase_amount))}
                          </p>
                        )}
                        {coupon.max_discount_amount && coupon.discount_type === 'percentage' && (
                          <p className="text-xs text-gray-500">
                            Máx: {formatPrice(Number(coupon.max_discount_amount))}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>
                          {coupon.current_uses || 0}
                          {coupon.max_uses ? ` / ${coupon.max_uses}` : ' usos'}
                        </p>
                        {coupon.max_uses_per_user && (
                          <p className="text-xs text-gray-500">
                            {coupon.max_uses_per_user} por cliente
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {coupon.valid_until ? (
                          <div>
                            <p>
                              Hasta{' '}
                              {new Date(coupon.valid_until).toLocaleDateString('es-GT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            {isExpired && (
                              <p className="text-xs text-red-500">Expirado</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Sin límite</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            isActive
                              ? 'bg-green-100 text-green-800'
                              : isExpired
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isActive ? 'Activo' : isExpired ? 'Expirado' : isMaxedOut ? 'Agotado' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/cupones/${coupon.id}`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteCouponButton couponId={coupon.id} couponCode={coupon.code} />
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
