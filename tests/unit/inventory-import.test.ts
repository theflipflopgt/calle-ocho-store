import { describe, expect, it } from 'vitest';
import {
  createInventoryTemplate,
  INVENTORY_IMPORT_COLUMNS,
  normalizeInventoryRows,
  parseInventoryWorkbook,
} from '@/lib/admin/inventory-import';

const emptyReferences = {
  productsBySku: new Map(),
  productsBySlug: new Map(),
  brandsByName: new Map(),
  categoriesByName: new Map(),
  variantsBySku: new Map(),
};

function inventoryRow(overrides: Record<string, string | number> = {}) {
  const data: Record<string, string | number> = {
    codigo_producto: 'co-0001',
    nombre: 'Tenis de prueba',
    marca: 'Marca',
    seccion: 'hombre',
    categoria: 'Sneakers',
    descripcion: 'Producto de prueba',
    talla_us: 9,
    talla_eu: 42,
    talla_uk: 8,
    talla_cm: 27,
    color: 'Negro',
    codigo_color: '#000000',
    sku_variante: 'co-0001-neg-9',
    costo: 500,
    porcentaje_factura: 5,
    porcentaje_neo_link: 4,
    ganancia_deseada: 100,
    precio_base: 500,
    precio_final_calculado: '',
    precio_anterior: 700,
    precio_especial_talla: '',
    stock: 4,
    stock_minimo: 2,
    warehouse: 'Principal',
    link_imagen_cloudinary: 'https://res.cloudinary.com/demo/image/upload/producto.jpg',
    estado: 'active',
    ...overrides,
  };

  return INVENTORY_IMPORT_COLUMNS.map((column) => String(data[column] ?? ''));
}

describe('inventory import validation', () => {
  it('preserves empty cells in their original spreadsheet columns', () => {
    const rows = parseInventoryWorkbook(createInventoryTemplate());
    const finalPriceIndex = rows[0].indexOf('precio_final_calculado');
    const stockIndex = rows[0].indexOf('stock');

    expect(rows[1][finalPriceIndex]).toBe('');
    expect(rows[1][stockIndex]).toBe('4');
  });

  it('accepts rows without a Cloudinary image', () => {
    const [result] = normalizeInventoryRows(
      [[...INVENTORY_IMPORT_COLUMNS], inventoryRow({ link_imagen_cloudinary: '' })],
      emptyReferences
    );

    expect(result.errors).toEqual([]);
    expect(result.normalized.link_imagen_cloudinary).toBe('');
  });

  it('allows one image on one size and no image on the other sizes', () => {
    const results = normalizeInventoryRows(
      [
        [...INVENTORY_IMPORT_COLUMNS],
        inventoryRow(),
        inventoryRow({ talla_us: 9.5, sku_variante: 'CO-0001-NEG-9.5', link_imagen_cloudinary: '' }),
      ],
      emptyReferences
    );

    expect(results.every((row) => row.errors.length === 0)).toBe(true);
  });

  it('accepts a product ready for sale', () => {
    const [result] = normalizeInventoryRows(
      [[...INVENTORY_IMPORT_COLUMNS], inventoryRow()],
      emptyReferences
    );

    expect(result.errors).toEqual([]);
    expect(result.normalized.codigo_producto).toBe('co-0001');
    expect(result.normalized.sku_variante).toBe('co-0001-neg-9');
    expect(result.normalized.isAvailable).toBe(true);
  });

  it('calculates the final price from cost, desired profit and fees', () => {
    const [result] = normalizeInventoryRows(
      [
        [...INVENTORY_IMPORT_COLUMNS],
        inventoryRow({
          precio_final_calculado: '',
          costo: 325,
          ganancia_deseada: 100,
          porcentaje_factura: 5,
          porcentaje_neo_link: 7,
        }),
      ],
      emptyReferences
    );

    expect(result.errors).toEqual([]);
    expect(result.normalized.precio_final_calculado).toBe(482.95);
    expect(result.normalized.ganancia_deseada).toBe(100);
  });

  it('rejects invoice and Neo Link fees totaling 100 percent', () => {
    const [result] = normalizeInventoryRows(
      [
        [...INVENTORY_IMPORT_COLUMNS],
        inventoryRow({
          precio_final_calculado: '',
          porcentaje_factura: 30,
          porcentaje_neo_link: 70,
        }),
      ],
      emptyReferences
    );

    expect(result.errors).toContain('La suma de factura y Neo Link debe ser menor al 100 %.');
    expect(result.action).toBe('skip');
  });

  it('rejects a sixth distinct image for the same product color', () => {
    const rows = Array.from({ length: 6 }, (_, index) =>
      inventoryRow({
        talla_us: 7 + index * 0.5,
        sku_variante: `CO-0001-NEG-${index}`,
        link_imagen_cloudinary: `https://res.cloudinary.com/demo/image/upload/producto-${index}.jpg`,
      })
    );
    const results = normalizeInventoryRows(
      [[...INVENTORY_IMPORT_COLUMNS], ...rows],
      emptyReferences
    );

    expect(results[5].errors).toContain('Cada color puede tener un maximo de 5 imagenes diferentes.');
    expect(results[5].action).toBe('skip');
  });

  it('rejects a previous price that would break the database constraint', () => {
    const [result] = normalizeInventoryRows(
      [[...INVENTORY_IMPORT_COLUMNS], inventoryRow({ precio_anterior: 650 })],
      emptyReferences
    );

    expect(result.errors).toContain('El precio anterior debe ser mayor que el precio final.');
    expect(result.action).toBe('skip');
  });

  it('rejects non-numeric stock instead of silently importing zero', () => {
    const [result] = normalizeInventoryRows(
      [[...INVENTORY_IMPORT_COLUMNS], inventoryRow({ stock: 'cuatro' })],
      emptyReferences
    );

    expect(result.errors).toContain('El stock debe ser numerico.');
    expect(result.action).toBe('skip');
  });

  it('rejects duplicate variant SKUs in the same workbook', () => {
    const results = normalizeInventoryRows(
      [
        [...INVENTORY_IMPORT_COLUMNS],
        inventoryRow(),
        inventoryRow({ talla_us: 9.5, sku_variante: 'CO-0001-NEG-9' }),
      ],
      emptyReferences
    );

    expect(results[1].errors[0]).toContain('SKU de variante esta repetido');
    expect(results[1].action).toBe('skip');
  });

  it('rejects inconsistent sale state across rows for one product', () => {
    const results = normalizeInventoryRows(
      [
        [...INVENTORY_IMPORT_COLUMNS],
        inventoryRow(),
        inventoryRow({ talla_us: 9.5, sku_variante: 'CO-0001-NEG-9.5', estado: 'draft' }),
      ],
      emptyReferences
    );

    expect(results[1].errors[0]).toContain('estado y el precio final deben coincidir');
  });
});
