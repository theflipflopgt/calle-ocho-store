import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getInventoryReferenceData,
  normalizeInventoryRows,
  parseInventoryWorkbook,
} from '@/lib/admin/inventory-import';
import { appLogger } from '@/lib/logger';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Sube un archivo Excel valido.' }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'El archivo debe ser .xlsx.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo no debe superar 2 MB.' }, { status: 400 });
  }

  const db = (createAdminClient() || auth.supabase) as any;

  try {
    const workbook = Buffer.from(await file.arrayBuffer());
    const rows = parseInventoryWorkbook(workbook);
    const refs = await getInventoryReferenceData(db);
    const previewRows = normalizeInventoryRows(rows, refs);
    const validRows = previewRows.filter((row) => row.errors.length === 0);

    const { data: batch, error: batchError } = await db
      .from('inventory_import_batches')
      .insert({
        file_name: file.name,
        status: 'previewed',
        total_rows: previewRows.length,
        valid_rows: validRows.length,
        error_rows: previewRows.length - validRows.length,
        created_by: auth.user.id,
      })
      .select('id')
      .single();

    if (batchError) throw batchError;

    if (previewRows.length > 0) {
      const { error: rowsError } = await db.from('inventory_import_rows').insert(
        previewRows.map((row) => ({
          batch_id: batch.id,
          row_number: row.rowNumber,
          raw_data: row.raw,
          normalized_data: row.normalized,
          action: row.action,
          errors: row.errors,
          warnings: row.warnings,
        }))
      );

      if (rowsError) throw rowsError;
    }

    return NextResponse.json({
      batchId: batch.id,
      totalRows: previewRows.length,
      validRows: validRows.length,
      errorRows: previewRows.length - validRows.length,
      rows: previewRows,
    });
  } catch (error) {
    appLogger.error('admin.inventory_import.preview_failed', {
      userId: auth.user.id,
      fileName: file.name,
      error: error instanceof Error ? error.message : 'unknown_error',
    });

    return NextResponse.json(
      { error: 'No se pudo leer el Excel. Usa la plantilla oficial y vuelve a intentar.' },
      { status: 400 }
    );
  }
}
