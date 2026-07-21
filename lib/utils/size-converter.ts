/**
 * Sistema de conversión de tallas de calzado
 *
 * Basado en tablas estándar de conversión
 */

export type SizeSystem = 'US' | 'EU' | 'UK' | 'CM';

export interface Size {
  us: number;
  eu: number;
  uk: number;
  cm: number;
}

/**
 * Tabla de conversión estándar (ejemplo, ajustar según necesidad)
 * Nota: En producción, esto debe venir de la base de datos
 */
const SIZE_CONVERSION_TABLE: Size[] = [
  { us: 6, eu: 39, uk: 5.5, cm: 24 },
  { us: 6.5, eu: 39.5, uk: 6, cm: 24.5 },
  { us: 7, eu: 40, uk: 6.5, cm: 25 },
  { us: 7.5, eu: 40.5, uk: 7, cm: 25.5 },
  { us: 8, eu: 41, uk: 7.5, cm: 26 },
  { us: 8.5, eu: 41.5, uk: 8, cm: 26.5 },
  { us: 9, eu: 42, uk: 8.5, cm: 27 },
  { us: 9.5, eu: 42.5, uk: 9, cm: 27.5 },
  { us: 10, eu: 43, uk: 9.5, cm: 28 },
  { us: 10.5, eu: 43.5, uk: 10, cm: 28.5 },
  { us: 11, eu: 44, uk: 10.5, cm: 29 },
  { us: 11.5, eu: 44.5, uk: 11, cm: 29.5 },
  { us: 12, eu: 45, uk: 11.5, cm: 30 },
];

/**
 * Convierte una talla entre diferentes sistemas
 */
export function convertSize(value: number, from: SizeSystem, to: SizeSystem): number {
  if (from === to) return value;

  const fromKey = from.toLowerCase() as keyof Size;
  const toKey = to.toLowerCase() as keyof Size;

  const sizeEntry = SIZE_CONVERSION_TABLE.find(s => s[fromKey] === value);

  if (!sizeEntry) {
    throw new Error(`Size ${value} ${from} not found in conversion table`);
  }

  return sizeEntry[toKey];
}

/**
 * Formatea una talla para mostrar
 */
export function formatSize(size: Size, system: SizeSystem): string {
  const value = size[system.toLowerCase() as keyof Size];
  return `${system} ${value}`;
}

/**
 * Formatea todas las tallas de un producto
 */
export function formatAllSizes(size: Size): string {
  return `US ${size.us} / EU ${size.eu} / UK ${size.uk} / ${size.cm} cm`;
}
