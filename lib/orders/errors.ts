export const ORDER_ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'Debes iniciar sesión para completar la compra.',
  EMPTY_CART: 'Tu carrito está vacío.',
  INVALID_SHIPPING: 'Completa correctamente tu información de envío.',
  INVALID_COUPON: 'El cupón no es válido.',
  COUPON_NOT_STARTED: 'El cupón aún no está disponible.',
  COUPON_EXPIRED: 'El cupón ha expirado.',
  COUPON_LIMIT_REACHED: 'El cupón alcanzó su límite de uso.',
  COUPON_USER_LIMIT_REACHED: 'Ya usaste este cupón el máximo permitido.',
  COUPON_MIN_PURCHASE_NOT_MET: 'No se cumple el mínimo de compra del cupón.',
  INSUFFICIENT_STOCK: 'Uno o más productos ya no tienen stock suficiente.',
  ORDER_NOT_FOUND: 'No se encontró la orden solicitada.',
  INVALID_STATUS: 'El estado solicitado no es válido.',
  INVALID_STATUS_TRANSITION: 'La transición de estado no está permitida.',
  ADMIN_ONLY: 'Esta acción requiere permisos de administrador.',
};

export function mapOrderErrorMessage(raw: string | null | undefined): string {
  if (!raw) {
    return 'No se pudo completar la operación.';
  }

  const key = raw.split(':')[0]?.trim();
  return ORDER_ERROR_MESSAGES[key] || 'No se pudo completar la operación.';
}
