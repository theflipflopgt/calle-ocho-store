/**
 * Formatea un número como precio en Quetzales
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número como precio compacto (ej: Q1.5k)
 */
export function formatPriceCompact(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}
