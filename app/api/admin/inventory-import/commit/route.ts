import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { appLogger } from '@/lib/logger';

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isUuid(body?.batchId)) {
    return NextResponse.json({ error: 'Lote de importación inválido.' }, { status: 400 });
  }

  const { data, error } = await (auth.supabase as any).rpc('commit_inventory_import', {
    p_batch_id: body.batchId,
  });

  if (error) {
    appLogger.error('admin.inventory_import.commit_failed', {
      userId: auth.user.id,
      batchId: body.batchId,
      error: error.message,
    });
    return NextResponse.json(
      {
        error: 'No se guardó ninguna fila. Revisa el lote completo e inténtalo de nuevo.',
        code: error.code || null,
        detail: process.env.NODE_ENV === 'development' ? error.message : null,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, ...data });
}
