import { NextResponse } from 'next/server';
import {
  getProductExportRows,
  productRowsToXlsx,
  requireAdminExport,
} from '@/lib/exports/admin-data';
import { createXlsx, exportDateStamp } from '@/lib/exports/xlsx';

export async function GET() {
  const auth = await requireAdminExport();
  if (auth.error) return auth.error;

  try {
    const rows = await getProductExportRows(auth.db);
    const file = createXlsx(productRowsToXlsx(rows));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="productos-calle-ocho-${exportDateStamp()}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'No se pudo exportar productos.' }, { status: 500 });
  }
}
