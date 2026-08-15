import { describe, expect, it } from 'vitest';
import { generateProductDescription } from '@/lib/products/product-description';

describe('generateProductDescription', () => {
  it('uses product identity without inventing technical specifications', () => {
    const result = generateProductDescription({
      name: 'Samba OG',
      brand: 'Adidas',
      category: 'Calzado',
      color: 'Negro/Blanco',
      gender: 'unisex',
    });

    expect(result).toContain('Samba OG de Adidas');
    expect(result).toContain('Negro/Blanco');
    expect(result).toContain('Calle Ocho Store');
    expect(result).not.toMatch(/cuero|tecnolog[ií]a|amortiguaci[oó]n/i);
  });

  it('requires a product name', () => {
    expect(() => generateProductDescription({ name: '   ' })).toThrow('PRODUCT_NAME_REQUIRED');
  });
});
