'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, Loader2, ShoppingBag, Truck, CreditCard, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { CouponInput } from '@/components/checkout/coupon-input';
import { type CouponValidationResult } from '@/lib/coupons';
import type { OrderCreateInput, OrderCreateResult } from '@/types/order-workflow';
import {
  FREE_SHIPPING_THRESHOLD_GTQ,
  SHIPPING_COST_GTQ,
  MANUAL_PAYMENT_LABEL,
} from '@/lib/constants/business';

// Departamentos de Guatemala
const DEPARTMENTS = [
  'Guatemala', 'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
  'El Progreso', 'Escuintla', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa',
  'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
  'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa'
];

// Costo de envío
const SHIPPING_COST = SHIPPING_COST_GTQ;
const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_GTQ;

interface ShippingFormData {
  recipientName: string;
  phone: string;
  streetAddress: string;
  zone: string;
  neighborhood: string;
  city: string;
  department: string;
  postalCode: string;
  additionalReferences: string;
  customerNotes: string;
}

type CheckoutStep = 'shipping' | 'review' | 'processing';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, isLoading: cartLoading } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);

  const [formData, setFormData] = useState<ShippingFormData>({
    recipientName: '',
    phone: '',
    streetAddress: '',
    zone: '',
    neighborhood: '',
    city: '',
    department: 'Guatemala',
    postalCode: '',
    additionalReferences: '',
    customerNotes: '',
  });

  // Calcular costos
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + shippingCost - discountAmount;

  // Cargar dirección guardada del usuario
  useEffect(() => {
    async function loadSavedAddress() {
      if (!user) return;

      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (addresses) {
        const addr = addresses as any;
        setFormData(prev => ({
          ...prev,
          recipientName: addr.recipient_name || '',
          phone: addr.phone || '',
          streetAddress: addr.street_address || '',
          zone: addr.zone || '',
          neighborhood: addr.neighborhood || '',
          city: addr.city || '',
          department: addr.department || 'Guatemala',
          postalCode: addr.postal_code || '',
          additionalReferences: addr.additional_references || '',
        }));
      }
    }

    loadSavedAddress();
  }, [user, supabase]);

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (!cartLoading && items.length === 0 && !orderCreated) {
      router.replace('/carrito');
    }
  }, [cartLoading, items.length, orderCreated, router]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateShipping = (): boolean => {
    if (!formData.recipientName.trim()) {
      setError('Por favor ingresa el nombre del destinatario');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setError('Por favor ingresa un número de teléfono válido');
      return false;
    }
    if (!formData.streetAddress.trim()) {
      setError('Por favor ingresa la dirección de envío');
      return false;
    }
    if (!formData.city.trim()) {
      setError('Por favor ingresa la ciudad');
      return false;
    }
    if (!formData.department) {
      setError('Por favor selecciona el departamento');
      return false;
    }
    return true;
  };

  const handleContinueToReview = () => {
    if (validateShipping()) {
      setStep('review');
      window.scrollTo(0, 0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    setStep('processing');

    try {
      const payload: OrderCreateInput = {
        shipping: {
          recipientName: formData.recipientName,
          phone: formData.phone,
          streetAddress: formData.streetAddress,
          zone: formData.zone,
          neighborhood: formData.neighborhood,
          city: formData.city,
          department: formData.department,
          postalCode: formData.postalCode,
          additionalReferences: formData.additionalReferences,
        },
        customerNotes: formData.customerNotes || undefined,
        couponCode: appliedCoupon?.coupon?.code,
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo crear el pedido');
      }

      const order = result.order as OrderCreateResult;

      // Evitar que el efecto de carrito vacío interrumpa la confirmación.
      setOrderCreated(true);

      // Navegar primero a la pantalla de agradecimiento.
      router.replace(`/checkout/confirmacion?order=${encodeURIComponent(order.orderNumber)}`);

      // Limpiar el carrito sin bloquear la navegación.
      void clearCart();
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Hubo un error al procesar tu orden. Por favor intenta de nuevo.');
      setStep('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      </main>
    );
  }

  if (!user || (items.length === 0 && !orderCreated)) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/carrito"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-black mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al carrito
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-black">
          Checkout
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 sm:mb-12">
        <div className="flex items-center gap-2 sm:gap-4">
          <StepIndicator
            number={1}
            label="Envío"
            icon={<MapPin className="w-4 h-4" />}
            isActive={step === 'shipping'}
            isComplete={step === 'review' || step === 'processing'}
          />
          <div className="w-8 sm:w-16 h-0.5 bg-gray-200" />
          <StepIndicator
            number={2}
            label="Revisar"
            icon={<ShoppingBag className="w-4 h-4" />}
            isActive={step === 'review'}
            isComplete={step === 'processing'}
          />
          <div className="w-8 sm:w-16 h-0.5 bg-gray-200" />
          <StepIndicator
            number={3}
            label="Confirmar"
            icon={<CreditCard className="w-4 h-4" />}
            isActive={step === 'processing'}
            isComplete={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {step === 'shipping' && (
            <ShippingForm
              formData={formData}
              onChange={handleInputChange}
              error={error}
              onContinue={handleContinueToReview}
            />
          )}

          {step === 'review' && (
            <ReviewStep
              items={items}
              formData={formData}
              onBack={() => setStep('shipping')}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {step === 'processing' && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-brand-blue mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-brand-black mb-2">
                Procesando tu orden...
              </h2>
              <p className="text-gray-500">
                Por favor no cierres esta página
              </p>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discountAmount={discountAmount}
            total={total}
            userId={user?.id}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={setAppliedCoupon}
            onRemoveCoupon={() => setAppliedCoupon(null)}
            showCouponInput={step === 'review'}
          />
        </div>
      </div>
    </main>
  );
}

// Step Indicator Component
function StepIndicator({
  number,
  label,
  icon,
  isActive,
  isComplete,
}: {
  number: number;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors",
          isComplete
            ? "bg-green-500 text-white"
            : isActive
              ? "bg-brand-black text-white"
              : "bg-gray-100 text-gray-400"
        )}
      >
        {isComplete ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : icon}
      </div>
      <span className={cn(
        "text-xs sm:text-sm font-medium",
        isActive || isComplete ? "text-brand-black" : "text-gray-400"
      )}>
        {label}
      </span>
    </div>
  );
}

// Shipping Form Component
function ShippingForm({
  formData,
  onChange,
  error,
  onContinue,
}: {
  formData: ShippingFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Truck className="w-5 h-5 text-brand-blue" />
        <h2 className="text-lg font-semibold text-brand-black">
          Información de Envío
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Recipient Name */}
        <div>
          <Label htmlFor="recipientName">Nombre del destinatario *</Label>
          <Input
            id="recipientName"
            name="recipientName"
            value={formData.recipientName}
            onChange={onChange}
            placeholder="Juan Pérez"
            className="mt-1"
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={onChange}
            placeholder="5555-1234"
            className="mt-1"
          />
        </div>

        {/* Street Address */}
        <div>
          <Label htmlFor="streetAddress">Dirección *</Label>
          <Input
            id="streetAddress"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={onChange}
            placeholder="5ta Avenida 10-50"
            className="mt-1"
          />
        </div>

        {/* Zone and Neighborhood */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zone">Zona</Label>
            <Input
              id="zone"
              name="zone"
              value={formData.zone}
              onChange={onChange}
              placeholder="Zona 10"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="neighborhood">Colonia/Barrio</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={onChange}
              placeholder="Oakland"
              className="mt-1"
            />
          </div>
        </div>

        {/* City and Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ciudad/Municipio *</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder="Ciudad de Guatemala"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="department">Departamento *</Label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={onChange}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Postal Code */}
        <div>
          <Label htmlFor="postalCode">Código Postal (opcional)</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            placeholder="01010"
            className="mt-1"
          />
        </div>

        {/* Additional References */}
        <div>
          <Label htmlFor="additionalReferences">Referencias adicionales</Label>
          <Textarea
            id="additionalReferences"
            name="additionalReferences"
            value={formData.additionalReferences}
            onChange={onChange}
            placeholder="Casa color azul, portón negro, a la par de la tienda..."
            className="mt-1"
            rows={2}
          />
        </div>

        {/* Customer Notes */}
        <div>
          <Label htmlFor="customerNotes">Notas para tu pedido (opcional)</Label>
          <Textarea
            id="customerNotes"
            name="customerNotes"
            value={formData.customerNotes}
            onChange={onChange}
            placeholder="Instrucciones especiales para la entrega..."
            className="mt-1"
            rows={2}
          />
        </div>
      </div>

      <Button
        className="w-full mt-6 h-12 text-base font-semibold bg-brand-black hover:bg-gray-800"
        onClick={onContinue}
      >
        Continuar al resumen
      </Button>
    </div>
  );
}

// Review Step Component
function ReviewStep({
  items,
  formData,
  onBack,
  onPlaceOrder,
  isSubmitting,
  error,
}: {
  items: any[];
  formData: ShippingFormData;
  onBack: () => void;
  onPlaceOrder: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Shipping Address Review */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-blue" />
            <h2 className="text-lg font-semibold text-brand-black">
              Dirección de Envío
            </h2>
          </div>
          <button
            onClick={onBack}
            className="text-sm text-brand-blue hover:underline"
          >
            Editar
          </button>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-brand-black">{formData.recipientName}</p>
          <p>{formData.phone}</p>
          <p>{formData.streetAddress}</p>
          <p>
            {[formData.zone, formData.neighborhood].filter(Boolean).join(', ')}
          </p>
          <p>
            {formData.city}, {formData.department}
          </p>
          {formData.postalCode && <p>CP: {formData.postalCode}</p>}
          {formData.additionalReferences && (
            <p className="text-gray-500 italic">{formData.additionalReferences}</p>
          )}
        </div>
      </div>

      {/* Items Review */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="w-5 h-5 text-brand-blue" />
          <h2 className="text-lg font-semibold text-brand-black">
            Productos ({items.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.variant.product_color.images[0]?.image_url ? (
                  <Image
                    src={item.variant.product_color.images[0].image_url}
                    alt={item.variant.product_color.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-black line-clamp-1">
                  {item.variant.product_color.product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {item.variant.product_color.color_name} · Talla {item.variant.size_us} · Cant: {item.quantity}
                </p>
                <p className="text-sm font-medium text-brand-black mt-1">
                  {formatPrice(item.variant.product_color.product.base_price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-brand-blue" />
          <h2 className="text-lg font-semibold text-brand-black">
            Método de Pago
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {MANUAL_PAYMENT_LABEL}. Te contactaremos para coordinar el pago.
        </p>
      </div>

      {/* Place Order Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1 sm:flex-none"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Button
          className="h-12 flex-1 text-base font-semibold bg-brand-black hover:bg-gray-800"
          onClick={onPlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            'Confirmar Pedido'
          )}
        </Button>
      </div>
    </div>
  );
}

// Order Summary Component
function OrderSummary({
  items,
  subtotal,
  shippingCost,
  discountAmount,
  total,
  userId,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  showCouponInput = false,
}: {
  items: any[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  userId?: string;
  appliedCoupon?: CouponValidationResult | null;
  onApplyCoupon?: (result: CouponValidationResult) => void;
  onRemoveCoupon?: () => void;
  showCouponInput?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-brand-black mb-4">
        Resumen del Pedido
      </h2>

      {/* Items count */}
      <div className="text-sm text-gray-600 mb-4">
        {items.reduce((sum, item) => sum + item.quantity, 0)} producto(s)
      </div>

      {/* Coupon Input */}
      {showCouponInput && userId && onApplyCoupon && onRemoveCoupon && (
        <div className="mb-4">
          <CouponInput
            userId={userId}
            subtotal={subtotal}
            onApply={onApplyCoupon}
            onRemove={onRemoveCoupon}
            appliedCoupon={appliedCoupon || undefined}
          />
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Envío</span>
          {shippingCost === 0 ? (
            <span className="text-green-600 font-medium">Gratis</span>
          ) : (
            <span className="font-medium">{formatPrice(shippingCost)}</span>
          )}
        </div>
        {shippingCost > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
          <p className="text-xs text-gray-500">
            ¡Agrega {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} más para envío gratis!
          </p>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento</span>
            <span className="font-medium">-{formatPrice(discountAmount)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 my-4 pt-4">
        <div className="flex justify-between">
          <span className="text-base font-semibold text-brand-black">Total</span>
          <span className="text-xl font-bold text-brand-black">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <p className="text-xs text-green-700 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Productos 100% originales
        </p>
      </div>
    </div>
  );
}
