'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Percent, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface OrderAdjustmentsEditorProps {
  orderId: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  status: string;
}

const discountOptions = [0, 10, 20] as const;

export function OrderAdjustmentsEditor({
  orderId,
  subtotal,
  shippingCost,
  discountAmount,
  status,
}: OrderAdjustmentsEditorProps) {
  const router = useRouter();
  const initialDiscount = subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0;
  const [discountPercent, setDiscountPercent] = useState(
    discountOptions.includes(initialDiscount as (typeof discountOptions)[number]) ? initialDiscount : 0
  );
  const [freeShipping, setFreeShipping] = useState(shippingCost === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canAdjust = status === 'pending';

  const previewDiscount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const previewShipping = freeShipping ? 0 : shippingCost;
  const previewTotal = Math.max(Math.round((subtotal + previewShipping - previewDiscount) * 100) / 100, 0);

  const saveAdjustments = async () => {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/adjustments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountPercent,
          freeShipping,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo aplicar el ajuste.');
      }

      setMessage('Ajuste aplicado al pedido.');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo aplicar el ajuste.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-brand-black flex items-center gap-2 mb-4">
        <Percent className="h-5 w-5" />
        Ajustes del pedido
      </h2>

      {!canAdjust && (
        <p className="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          Los descuentos y envío gratis solo se aplican antes de confirmar el pago.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Descuento administrativo</p>
          <div className="grid grid-cols-3 gap-2">
            {discountOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={discountPercent === option ? 'default' : 'outline'}
                size="sm"
                className={cn(discountPercent === option && 'bg-brand-blue hover:bg-brand-blue/90')}
                disabled={!canAdjust || isSaving}
                onClick={() => setDiscountPercent(option)}
              >
                {option}%
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant={freeShipping ? 'default' : 'outline'}
          size="sm"
          className={cn('w-full justify-start', freeShipping && 'bg-green-600 hover:bg-green-700')}
          disabled={!canAdjust || isSaving || freeShipping}
          onClick={() => setFreeShipping(true)}
        >
          <Truck className="mr-2 h-4 w-4" />
          {freeShipping ? 'Envío gratis aplicado' : 'Quitar monto del envío'}
        </Button>

        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Descuento</span>
            <span>-{formatPrice(previewDiscount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Envío</span>
            <span>{formatPrice(previewShipping)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
            <span>Total ajustado</span>
            <span>{formatPrice(previewTotal)}</span>
          </div>
        </div>

        {message && <p className="text-xs text-green-700">{message}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button
          type="button"
          className="w-full bg-brand-black hover:bg-gray-800"
          disabled={!canAdjust || isSaving}
          onClick={saveAdjustments}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Aplicar ajuste'
          )}
        </Button>
      </div>
    </div>
  );
}
