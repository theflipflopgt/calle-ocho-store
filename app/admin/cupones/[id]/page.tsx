import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CouponForm } from '../coupon-form';

interface EditCouponPageProps {
  params: Promise<{ id: string }>;
}

async function getCoupon(id: string) {
  const supabase = await createClient();

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !coupon) {
    return null;
  }

  return coupon;
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = await params;
  const coupon = await getCoupon(id);

  if (!coupon) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Editar Cupón</h1>
        <p className="text-gray-600 mt-1">Modifica el cupón {coupon.code}</p>
      </div>

      <CouponForm coupon={coupon} />
    </div>
  );
}
