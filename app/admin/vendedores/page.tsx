import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils/currency';
import { BadgeDollarSign, Package, ReceiptText, UserRound } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateSellerCommissionRule } from './actions';
import Link from 'next/link';

type SellerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commissionPercent: number;
  orderCount: number;
  pairCount: number;
  salesTotal: number;
  commissionAmount: number;
  products: Map<string, { name: string; quantity: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string | null;
    assignedAt: string | null;
  }>;
};

async function getSellerSummaries() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user || !auth.isAdmin) {
    return [];
  }

  const admin = createAdminClient();
  const db = (admin || auth.supabase) as any;

  const [{ data: sellers, error: sellersError }, { data: rules, error: rulesError }, { data: orders, error: ordersError }] =
    await Promise.all([
      db
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('role', 'seller')
        .order('full_name', { ascending: true }),
      db
        .from('seller_commission_rules')
        .select('seller_id, commission_percent, is_active'),
      db
        .from('orders')
        .select(
          `
            id,
            order_number,
            seller_id,
            status,
            total,
            created_at,
            seller_assigned_at,
            seller_commission_amount,
            order_items (
              product_name,
              quantity,
              subtotal
            )
          `
        )
        .not('seller_id', 'is', null),
    ]);

  if (sellersError) {
    console.error('Error fetching sellers:', sellersError);
    return [];
  }

  if (rulesError) {
    console.error('Error fetching seller commission rules:', rulesError);
  }

  if (ordersError) {
    console.error('Error fetching seller orders:', ordersError);
  }

  const ruleMap = new Map<string, number>(
    (rules || [])
      .filter((rule: any) => rule.is_active !== false)
      .map((rule: any) => [String(rule.seller_id), Number(rule.commission_percent || 0)])
  );

  const summaries = new Map<string, SellerSummary>();

  for (const seller of sellers || []) {
    summaries.set(seller.id, {
      id: seller.id,
      name: seller.full_name || seller.email || 'Vendedor sin nombre',
      email: seller.email,
      phone: seller.phone,
      commissionPercent: ruleMap.get(seller.id) || 0,
      orderCount: 0,
      pairCount: 0,
      salesTotal: 0,
      commissionAmount: 0,
      products: new Map(),
      recentOrders: [],
    });
  }

  for (const order of orders || []) {
    if (!order.seller_id || !summaries.has(order.seller_id)) continue;
    const summary = summaries.get(order.seller_id)!;
    summary.recentOrders.push({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: Number(order.total || 0),
      createdAt: order.created_at,
      assignedAt: order.seller_assigned_at,
    });

    if (['cancelled', 'refunded'].includes(order.status)) continue;

    const total = Number(order.total || 0);
    const configuredCommission = (total * summary.commissionPercent) / 100;
    const storedCommission = Number(order.seller_commission_amount || 0);

    summary.orderCount += 1;
    summary.salesTotal += total;
    summary.commissionAmount += storedCommission > 0 ? storedCommission : configuredCommission;

    for (const item of order.order_items || []) {
      const quantity = Number(item.quantity || 0);
      summary.pairCount += quantity;

      const product = summary.products.get(item.product_name) || {
        name: item.product_name || 'Producto sin nombre',
        quantity: 0,
      };
      product.quantity += quantity;
      summary.products.set(product.name, product);
    }
  }

  return Array.from(summaries.values()).sort((a, b) => b.salesTotal - a.salesTotal);
}

export default async function SellersPage() {
  const sellers = await getSellerSummaries();
  const totals = sellers.reduce(
    (acc, seller) => {
      acc.orders += seller.orderCount;
      acc.pairs += seller.pairCount;
      acc.sales += seller.salesTotal;
      acc.commission += seller.commissionAmount;
      return acc;
    },
    { orders: 0, pairs: 0, sales: 0, commission: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Vendedores y comisiones</h1>
        <p className="mt-1 text-gray-600">
          Control de pares vendidos, ventas asignadas y comision estimada por vendedor.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat icon={UserRound} label="Vendedores" value={String(sellers.length)} />
        <SummaryStat icon={ReceiptText} label="Ordenes asignadas" value={String(totals.orders)} />
        <SummaryStat icon={Package} label="Pares vendidos" value={String(totals.pairs)} />
        <SummaryStat icon={BadgeDollarSign} label="Comision estimada" value={formatPrice(totals.commission)} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-brand-black">Reglas de comision</h2>
        <p className="mt-1 text-sm text-gray-600">
          Define el porcentaje por vendedor. Las ordenes canceladas o reembolsadas no cuentan.
        </p>

        <div className="mt-5 space-y-4">
          {sellers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No hay usuarios con rol vendedor. Crealos o cambia el rol desde Usuarios.
            </div>
          ) : (
            sellers.map((seller) => {
              const topProducts = Array.from(seller.products.values())
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 3);

              return (
                <div key={seller.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:items-center">
                    <div>
                      <h3 className="font-medium text-brand-black">{seller.name}</h3>
                      <p className="text-sm text-gray-600">{seller.email}</p>
                      {seller.phone && <p className="text-sm text-gray-500">{seller.phone}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm lg:col-span-2">
                      <Metric label="Pares" value={String(seller.pairCount)} />
                      <Metric label="Ventas" value={formatPrice(seller.salesTotal)} />
                      <Metric label="Comision" value={formatPrice(seller.commissionAmount)} />
                    </div>

                    <form action={updateSellerCommissionRule} className="flex items-end gap-2">
                      <input type="hidden" name="seller_id" value={seller.id} />
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          % comision
                        </label>
                        <Input
                          name="commission_percent"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={seller.commissionPercent}
                        />
                      </div>
                      <Button type="submit" className="bg-brand-blue hover:bg-brand-blue/90">
                        Guardar
                      </Button>
                    </form>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium uppercase text-gray-500">Productos vendidos</p>
                    {topProducts.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {topProducts.map((product) => (
                          <span
                            key={product.name}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                          >
                            {product.name}: {product.quantity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">Sin productos asignados todavia.</p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase text-gray-500">Pedidos recientes</p>
                      <Link
                        href="/admin/ordenes"
                        className="text-xs font-medium text-brand-blue hover:underline"
                      >
                        Todas las órdenes
                      </Link>
                    </div>
                    {seller.recentOrders.length > 0 ? (
                      <div className="mt-2 divide-y divide-gray-100">
                        {seller.recentOrders
                          .sort(
                            (a, b) =>
                              new Date(b.assignedAt || b.createdAt || 0).getTime() -
                              new Date(a.assignedAt || a.createdAt || 0).getTime()
                          )
                          .slice(0, 5)
                          .map((order) => {
                            const status = sellerOrderStatus[order.status] || sellerOrderStatus.pending;
                            return (
                              <Link
                                key={order.id}
                                href={`/admin/ordenes/${order.id}`}
                                className="flex flex-col gap-2 py-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-medium text-brand-blue">#{order.orderNumber}</p>
                                  <p className="text-xs text-gray-500">
                                    Asignado {formatSellerDate(order.assignedAt || order.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 sm:justify-end">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                                    {status.label}
                                  </span>
                                  <span className="font-medium text-brand-black">
                                    {formatPrice(order.total)}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">Sin pedidos asignados todavía.</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const sellerOrderStatus: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pagado', className: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Procesando', className: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-700' },
};

function formatSellerDate(value?: string | null) {
  if (!value) return 'sin fecha';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          <Icon className="h-5 w-5 text-brand-black" />
        </div>
        <div>
          <p className="text-xl font-bold text-brand-black">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-brand-black">{value}</p>
    </div>
  );
}
