import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { mapOrderErrorMessage } from '@/lib/orders/errors';
import { appLogger } from '@/lib/logger';

interface NotesRequestBody {
  notes?: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageOrders) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const limit = consumeRateLimit({
    bucket: 'admin-order-notes',
    key: `${auth.user.id}:${ip}`,
    max: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429 }
    );
  }

  let body: NotesRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if ((body.notes || '').length > 5000) {
    return NextResponse.json({ error: 'La nota excede el máximo permitido.' }, { status: 400 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID de orden inválido.' }, { status: 400 });
  }

  const db = auth.supabase as any;

  const { data, error } = await db.rpc('admin_update_order_notes', {
    p_order_id: id,
    p_notes: body.notes || null,
  });

  if (error || !data) {
    appLogger.error('admin.orders.notes.failed', {
      requestId,
      orderId: id,
      adminUserId: auth.user.id,
      dbError: error?.message,
      dbCode: error?.code,
    });

    return NextResponse.json(
      { error: mapOrderErrorMessage(error?.message) },
      { status: 400 }
    );
  }

  appLogger.info('admin.orders.notes.updated', {
    requestId,
    orderId: id,
    adminUserId: auth.user.id,
  });

  return NextResponse.json({ success: true, notes: data });
}
