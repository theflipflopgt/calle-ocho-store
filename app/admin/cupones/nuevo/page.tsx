import { CouponForm } from '../coupon-form';

export default function NewCouponPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-black">Nuevo Cupón</h1>
        <p className="text-gray-600 mt-1">Crea un nuevo código de descuento</p>
      </div>

      <CouponForm />
    </div>
  );
}
