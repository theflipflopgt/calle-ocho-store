export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface ShippingInput {
  recipientName: string;
  phone: string;
  streetAddress: string;
  zone?: string;
  neighborhood?: string;
  city: string;
  department: string;
  postalCode?: string;
  additionalReferences?: string;
}

export type CheckoutPaymentMethod = 'bank_transfer' | 'card' | 'neocuotas';

export interface OrderCreateInput {
  customerEmail?: string;
  shipping: ShippingInput;
  customerNotes?: string;
  couponCode?: string;
  paymentMethod: CheckoutPaymentMethod;
  items?: {
    variantId: string;
    quantity: number;
  }[];
}

export interface OrderCreateResult {
  orderId: string;
  orderNumber: string;
  accessToken?: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
}

export interface PaymentManualRecord {
  method: CheckoutPaymentMethod | 'cash_on_delivery';
  status: 'pending' | 'completed' | 'refunded';
  amount: number;
}

export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
}
