import { roundMoney } from '@/lib/utils/currency';

interface SellerPerformanceOrder {
  status: string;
  total: number | string | null;
  seller_commission_amount: number | string | null;
  order_items?: Array<{ quantity: number | string | null }> | null;
}

const SALE_STATUSES = new Set(['paid', 'processing', 'shipped', 'delivered']);

export function calculateSellerPerformance(orders: SellerPerformanceOrder[]) {
  const assignedOrders = orders.filter(
    (order) => !['cancelled', 'refunded'].includes(order.status)
  );
  const completedSales = assignedOrders.filter((order) => SALE_STATUSES.has(order.status));

  return {
    assigned: assignedOrders.length,
    pairs: completedSales.reduce(
      (total, order) =>
        total +
        (order.order_items || []).reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        ),
      0
    ),
    sales: roundMoney(
      completedSales.reduce((total, order) => total + Number(order.total || 0), 0)
    ),
    commission: roundMoney(
      completedSales.reduce(
        (total, order) => total + Number(order.seller_commission_amount || 0),
        0
      )
    ),
  };
}
