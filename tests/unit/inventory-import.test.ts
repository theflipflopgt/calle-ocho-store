import { describe, expect, it } from 'vitest';
import {
  INVENTORY_IMPORT_COLUMNS,
  normalizeInventoryRows,
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
    porcentaje_margen: 25,
    precio_base: 500,
    precio_final_calculado: 670,
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
