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

export interface OrderCreateInput {
  shipping: ShippingInput;
  customerNotes?: string;
  couponCode?: string;
}

export interface OrderCreateResult {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
}

export interface PaymentManualRecord {
  method: 'cash_on_delivery' | 'bank_transfer';
  status: 'pending' | 'completed' | 'refunded';
  amount: number;
}

export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
}
