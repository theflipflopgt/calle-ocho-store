import { NextRequest, NextResponse } from 'next/server';
import {
  getSalesExportRows,
  requireAdminExport,
  salesRowsToXlsx,
} from '@/lib/exports/admin-data';
import { createXlsx } from '@/lib/exports/xlsx';

export async function GET(request: NextRequest) {
  const auth = await requireAdminExport();
  if (auth.error) return auth.error;

  try {
    const { rows, period } = await getSalesExportRows(auth.db, request.nextUrl);
    const file = createXlsx(salesRowsToXlsx(rows));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ventas-calle-ocho-${period.from}-a-${period.to}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting sales:', error);
    if (error instanceof Error && error.message === 'INVALID_SALES_EXPORT_PERIOD') {
      return NextResponse.json({ error: 'El período de exportación no es válido.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'No se pudo exportar ventas.' }, { status: 500 });
  }
}
