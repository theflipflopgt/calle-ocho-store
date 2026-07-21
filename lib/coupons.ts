import { createClient } from '@/lib/supabase/client';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    min_purchase_amount: number | null;
    max_discount_amount: number | null;
  };
  error?: string;
  discount_amount?: number;
}

export async function validateCoupon(
  code: string,
  userId: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const supabase = createClient();

  try {
    // Fetch coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return { valid: false, error: 'Cupón no válido' };
    }

    // Check if expired
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      return { valid: false, error: 'Este cupón aún no es válido' };
    }

    if (validUntil && now > validUntil) {
      return { valid: false, error: 'Este cupón ha expirado' };
    }

    // Check max uses
    if (coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses) {
      return { valid: false, error: 'Este cupón ya alcanzó su límite de usos' };
    }

    // Check uses per user
    if (coupon.max_uses_per_user) {
      const { data: userUses } = await supabase
        .from('coupon_uses')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId);

      if (userUses && userUses.length >= coupon.max_uses_per_user) {
        return { valid: false, error: 'Ya has usado este cupón el máximo de veces permitidas' };
      }
    }

    // Check minimum purchase amount
    if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
      return {
        valid: false,
        error: `Compra mínima de Q${coupon.min_purchase_amount.toFixed(2)} requerida`,
      };
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
      // Apply max discount if specified
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      // fixed_amount
      discountAmount = Math.min(coupon.discount_value, subtotal);
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed_amount',
        discount_value: coupon.discount_value,
        min_purchase_amount: coupon.min_purchase_amount,
        max_discount_amount: coupon.max_discount_amount,
      },
      discount_amount: discountAmount,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, error: 'Error al validar el cupón' };
  }
}

export async function incrementCouponUsage(couponId: string, userId: string, orderId: string) {
  const supabase = createClient();

  try {
    // Increment current_uses
    await (supabase as any).rpc('increment_coupon_usage', { coupon_id: couponId });

    // Record usage
    await supabase
      .from('coupon_uses')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
      });
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
  }
}
