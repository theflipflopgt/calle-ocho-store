import { NextResponse } from 'next/server';
import {
  getProductExportRows,
  inventoryRowsToXlsx,
  requireInventoryExport,
} from '@/lib/exports/admin-data';
import { createXlsx, exportDateStamp } from '@/lib/exports/xlsx';

export async function GET() {
  const auth = await requireInventoryExport();
  if (auth.error) return auth.error;

  try {
    const rows = await getProductExportRows(auth.db);
    const file = createXlsx(inventoryRowsToXlsx(rows));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventario-calle-ocho-${exportDateStamp()}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting inventory:', error);
    return NextResponse.json({ error: 'No se pudo exportar el inventario.' }, { status: 500 });
  }
}
