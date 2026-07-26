import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createInventoryTemplate } from '@/lib/admin/inventory-import';
import { exportDateStamp } from '@/lib/exports/xlsx';

export async function GET() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const template = createInventoryTemplate();
  const body = template.buffer.slice(
    template.byteOffset,
    template.byteOffset + template.byteLength
  ) as ArrayBuffer;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="plantilla-inventario-calle-ocho-${exportDateStamp()}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
