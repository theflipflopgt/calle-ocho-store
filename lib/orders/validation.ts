import type { OrderCreateInput, ShippingInput } from '@/types/order-workflow';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasMinLength(value: string | undefined, min: number): boolean {
  if (!value) {
    return false;
  }

  return value.trim().length >= min;
}

export function validateShippingInput(input: ShippingInput): ValidationResult {
  if (!hasMinLength(input.recipientName, 2)) {
    return { valid: false, error: 'El nombre del destinatario es obligatorio.' };
  }

  if (!hasMinLength(input.phone, 8)) {
    return { valid: false, error: 'El teléfono no es válido.' };
  }

  if (!hasMinLength(input.streetAddress, 5)) {
    return { valid: false, error: 'La dirección de envío es obligatoria.' };
  }

  if (!hasMinLength(input.city, 2)) {
    return { valid: false, error: 'La ciudad es obligatoria.' };
  }

  if (!hasMinLength(input.department, 2)) {
    return { valid: false, error: 'El departamento es obligatorio.' };
  }

  return { valid: true };
}

export function validateOrderCreateInput(input: Partial<OrderCreateInput>): ValidationResult {
  if (input.customerEmail) {
    const email = input.customerEmail.trim().toLowerCase();
    if (!emailRegex.test(email) || email.length > 254) {
      return { valid: false, error: 'Ingresa un correo válido.' };
    }
  }

  if (!input.shipping) {
    return { valid: false, error: 'Falta la dirección de envío.' };
  }

  const shippingValidation = validateShippingInput(input.shipping);
  if (!shippingValidation.valid) {
    return shippingValidation;
  }

  if (input.couponCode && input.couponCode.trim().length > 40) {
    return { valid: false, error: 'El cupón no es válido.' };
  }

  if (input.customerNotes && input.customerNotes.length > 500) {
    return { valid: false, error: 'Las notas exceden el máximo permitido.' };
  }

  if (!input.paymentMethod || !['bank_transfer', 'cash_on_delivery', 'card', 'neocuotas'].includes(input.paymentMethod)) {
    return { valid: false, error: 'Selecciona un método de pago válido.' };
  }

  return { valid: true };
}

export function validateGuestOrderCreateInput(input: Partial<OrderCreateInput>): ValidationResult {
  if (!input.customerEmail) {
    return { valid: false, error: 'Ingresa tu correo para recibir la confirmación.' };
  }

  const baseValidation = validateOrderCreateInput(input);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { valid: false, error: 'El carrito está vacío.' };
  }

  if (input.items.length > 30) {
    return { valid: false, error: 'El carrito tiene demasiados productos.' };
  }

  for (const item of input.items) {
    if (!item || !uuidRegex.test(item.variantId)) {
      return { valid: false, error: 'Uno de los productos no es válido.' };
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return { valid: false, error: 'La cantidad de un producto no es válida.' };
    }
  }

  return { valid: true };
}
