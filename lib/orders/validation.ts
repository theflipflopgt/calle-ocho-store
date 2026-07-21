import type { OrderCreateInput, ShippingInput } from '@/types/order-workflow';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

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

  return { valid: true };
}
