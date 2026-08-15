export interface ProductDescriptionInput {
  name: string;
  brand?: string;
  category?: string;
  color?: string;
  gender?: string;
}

function clean(value?: string) {
  return String(value || '').trim();
}

function audienceForGender(gender?: string) {
  const normalized = clean(gender).toLowerCase();
  if (normalized === 'hombre' || normalized === 'men') return 'hombre';
  if (normalized === 'mujer' || normalized === 'women') return 'mujer';
  if (normalized === 'ninos' || normalized === 'niños' || normalized === 'kids') return 'niños';
  return 'estilo unisex';
}

export function generateProductDescription(input: ProductDescriptionInput) {
  const name = clean(input.name);
  const brand = clean(input.brand);
  const category = clean(input.category);
  const color = clean(input.color);
  const audience = audienceForGender(input.gender);

  if (!name) {
    throw new Error('PRODUCT_NAME_REQUIRED');
  }

  const identity = brand ? `${name} de ${brand}` : name;
  const colorPhrase = color ? ` en color ${color}` : '';
  const categoryPhrase = category ? ` dentro de nuestra selección de ${category}` : '';

  return `${identity}${colorPhrase} es una opción pensada para quienes buscan un look actual y versátil${categoryPhrase}. Su diseño combina fácilmente con outfits casuales y urbanos, manteniendo al calzado como protagonista.\n\nIdeal para ${audience}. Consulta las tallas disponibles y el stock actualizado antes de finalizar tu compra en Calle Ocho Store.`;
}
