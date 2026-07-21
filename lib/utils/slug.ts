/**
 * Genera un slug URL-friendly a partir de un string
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Reemplazar espacios con guiones
    .replace(/\s+/g, '-')
    // Remover caracteres especiales
    .replace(/[^\w\-]+/g, '')
    // Remover múltiples guiones
    .replace(/\-\-+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Genera un SKU único para un producto
 * Formato: BRAND-PRODUCT-COLOR-SIZE
 */
export function generateSKU(
  brandSlug: string,
  productSlug: string,
  colorSuffix: string,
  sizeUS: number
): string {
  const brand = brandSlug.substring(0, 3).toUpperCase();
  const product = productSlug.substring(0, 5).toUpperCase();
  const color = colorSuffix.toUpperCase();
  const size = sizeUS.toString().replace('.', '');

  return `${brand}-${product}-${color}-${size}`;
}

/**
 * Genera un SKU base simplificado a partir del nombre del producto
 */
export function generateBaseSKU(name: string): string {
  return name
    .toString()
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\w]+/g, '')
    .substring(0, 8);
}
