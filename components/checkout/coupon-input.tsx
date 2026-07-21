'use client';

import { useState } from 'react';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateCoupon, type CouponValidationResult } from '@/lib/coupons';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface CouponInputProps {
  userId: string;
  subtotal: number;
  onApply: (result: CouponValidationResult) => void;
  onRemove: () => void;
  appliedCoupon?: CouponValidationResult;
}

export function CouponInput({
  userId,
  subtotal,
  onApply,
  onRemove,
  appliedCoupon,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await validateCoupon(code.trim(), userId, subtotal);

      if (result.valid) {
        onApply(result);
        setCode('');
        setIsExpanded(false);
      } else {
        setError(result.error || 'Cupón no válido');
      }
    } catch (err) {
      setError('Error al validar el cupón');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    setCode('');
    setError(null);
  };

  if (appliedCoupon?.valid && appliedCoupon.coupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                Cupón aplicado: {appliedCoupon.coupon.code}
              </p>
              <p className="text-sm text-green-700">
                Descuento: {formatPrice(appliedCoupon.discount_amount || 0)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-brand-blue hover:bg-blue-50 rounded-lg border border-dashed border-gray-300 transition-colors"
      >
        <Tag className="w-4 h-4" />
        ¿Tienes un cupón de descuento?
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-5 h-5 text-brand-blue" />
        <h3 className="font-medium text-brand-black">Aplicar cupón</h3>
      </div>

      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="CODIGO123"
          className="flex-1 uppercase"
          disabled={isValidating}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <Button
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
          className="bg-brand-black hover:bg-gray-800"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Aplicar'
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={() => {
          setIsExpanded(false);
          setCode('');
          setError(null);
        }}
        className="text-xs text-gray-500 hover:text-gray-700 mt-3"
      >
        Cancelar
      </button>
    </div>
  );
}
