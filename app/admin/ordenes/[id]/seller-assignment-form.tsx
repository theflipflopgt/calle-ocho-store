import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils/currency';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateOrderSeller } from './seller-assignment-actions';

async function getSellers() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user || !auth.isAdmin) {
    return [];
  }

  const admin = createAdminClient();
  const db = (admin || auth.supabase) as any;

  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'seller')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }

  return data || [];
}

export async function SellerAssignmentForm({
  orderId,
  currentSellerId,
  commissionRate,
  commissionAmount,
}: {
  orderId: string;
  currentSellerId?: string | null;
  commissionRate?: number | null;
  commissionAmount?: number | null;
}) {
  const sellers = await getSellers();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-brand-black flex items-center gap-2 mb-4">
        <UserRound className="h-5 w-5" />
        Vendedor
      </h2>

      <form action={updateOrderSeller} className="space-y-3">
        <input type="hidden" name="order_id" value={orderId} />
        <select
          name="seller_id"
          defaultValue={currentSellerId || ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">Sin vendedor asignado</option>
          {sellers.map((seller: any) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name || seller.email}
            </option>
          ))}
        </select>

        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Comision aplicada</span>
            <span className="font-medium text-brand-black">{Number(commissionRate || 0).toFixed(2)}%</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-gray-600">Monto estimado</span>
            <span className="font-medium text-brand-black">{formatPrice(Number(commissionAmount || 0))}</span>
          </div>
        </div>

        <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue/90">
          Guardar vendedor
        </Button>
      </form>
    </div>
  );
}
