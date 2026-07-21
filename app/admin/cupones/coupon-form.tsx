'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean | null;
}

interface CouponFormProps {
  coupon?: Coupon;
}

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const isEditing = !!coupon;

  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 10,
    min_purchase_amount: coupon?.min_purchase_amount || '',
    max_discount_amount: coupon?.max_discount_amount || '',
    max_uses: coupon?.max_uses || '',
    max_uses_per_user: coupon?.max_uses_per_user || 1,
    valid_until: coupon?.valid_until
      ? new Date(coupon.valid_until).toISOString().split('T')[0]
      : '',
    is_active: coupon?.is_active ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = () => {
    setFormData((prev) => ({ ...prev, code: generateCouponCode() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const couponData = {
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_purchase_amount: formData.min_purchase_amount ? Number(formData.min_purchase_amount) : null,
      max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
      max_uses: formData.max_uses ? Number(formData.max_uses) : null,
      max_uses_per_user: formData.max_uses_per_user || 1,
      valid_until: formData.valid_until
        ? new Date(formData.valid_until + 'T23:59:59').toISOString()
        : null,
      is_active: formData.is_active,
    };

    if (isEditing) {
      const { error } = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', coupon.id);

      if (error) {
        console.error('Error updating coupon:', error);
        setError('Error al actualizar el cupón. El código podría estar duplicado.');
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from('coupons').insert(couponData);

      if (error) {
        console.error('Error creating coupon:', error);
        setError('Error al crear el cupón. El código podría estar duplicado.');
        setIsLoading(false);
        return;
      }
    }

    router.push('/admin/cupones');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Código del Cupón *</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="DESCUENTO20"
              className="font-mono uppercase"
              required
            />
            <Button type="button" variant="outline" onClick={handleGenerateCode}>
              <Sparkles className="h-4 w-4 mr-1" />
              Generar
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción (interno)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Cupón para campaña de verano..."
            rows={2}
          />
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount_type">Tipo de Descuento</Label>
            <select
              id="discount_type"
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({ ...formData, discount_type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed_amount">Monto Fijo (Q)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_value">
              Valor del Descuento {formData.discount_type === 'percentage' ? '(%)' : '(Q)'}
            </Label>
            <Input
              id="discount_value"
              type="number"
              min="0"
              step={formData.discount_type === 'percentage' ? '1' : '0.01'}
              max={formData.discount_type === 'percentage' ? '100' : undefined}
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_value: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>
        </div>

        {/* Min/Max Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min_purchase_amount">Compra Mínima (Q)</Label>
            <Input
              id="min_purchase_amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.min_purchase_amount}
              onChange={(e) =>
                setFormData({ ...formData, min_purchase_amount: e.target.value })
              }
              placeholder="Sin mínimo"
            />
          </div>
          {formData.discount_type === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="max_discount_amount">Descuento Máximo (Q)</Label>
              <Input
                id="max_discount_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.max_discount_amount}
                onChange={(e) =>
                  setFormData({ ...formData, max_discount_amount: e.target.value })
                }
                placeholder="Sin límite"
              />
            </div>
          )}
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_uses">Usos Totales Máximos</Label>
            <Input
              id="max_uses"
              type="number"
              min="1"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
              placeholder="Ilimitado"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_uses_per_user">Usos por Cliente</Label>
            <Input
              id="max_uses_per_user"
              type="number"
              min="1"
              value={formData.max_uses_per_user}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_uses_per_user: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        {/* Valid Until */}
        <div className="space-y-2">
          <Label htmlFor="valid_until">Válido Hasta</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Dejar vacío para sin fecha de expiración
          </p>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_active">Cupón Activo</Label>
            <p className="text-sm text-gray-600">
              Los cupones inactivos no pueden ser usados
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/admin/cupones">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-brand-blue hover:bg-brand-blue/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Guardando...' : 'Creando...'}
            </>
          ) : isEditing ? (
            'Guardar Cambios'
          ) : (
            'Crear Cupón'
          )}
        </Button>
      </div>
    </form>
  );
}
