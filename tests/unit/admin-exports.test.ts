import { describe, expect, it } from 'vitest';
import {
  getSalesExportPeriod,
  inventoryRowsToXlsx,
  salesRowsToXlsx,
} from '@/lib/exports/admin-data';

describe('admin exports', () => {
  it('uses and validates the selected sales period', () => {
    expect(getSalesExportPeriod(new URL('https://example.com?from=2026-08-01&to=2026-08-13')))
      .toEqual({ from: '2026-08-01', to: '2026-08-13' });
    expect(() => getSalesExportPeriod(new URL('https://example.com?from=2026-08-31&to=2026-08-01')))
      .toThrow('INVALID_SALES_EXPORT_PERIOD');
    expect(() => getSalesExportPeriod(new URL('https://example.com?from=2026-02-30&to=2026-03-01')))
      .toThrow('INVALID_SALES_EXPORT_PERIOD');
  });

  it('includes grouping columns in sales rows', () => {
    const rows = salesRowsToXlsx([{
      order: {
        order_number: 'CO-1', created_at: '2026-08-13T18:00:00Z', status: 'paid',
        shipping_recipient_name: 'Cliente', subtotal: 100, discount_amount: 0,
        shipping_cost: 0, total: 100,
      },
      item: null,
    }]);
    expect(rows[0].slice(0, 5)).toEqual(['Pedido', 'Fecha', 'Año', 'Mes', 'Día']);
    expect(rows[1].slice(2, 5)).toEqual(['2026', '2026-08', '13']);
  });

  it('exports inventory by product and size', () => {
    const rows = inventoryRowsToXlsx([{
      product: { sku: 'P-1', name: 'Tenis', base_price: 500 },
      color: { color_name: 'Negro' },
      variant: { sku: 'P-1-8', size_us: 8, size_eu: 41, stock_quantity: 3, low_stock_threshold: 2, is_available: true },
    }]);
    expect(rows[0]).toContain('Talla EU');
    expect(rows[1]).toContain('P-1-8');
    expect(rows[1]).toContain(3);
  });
});
