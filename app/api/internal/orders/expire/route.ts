import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { appLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const internalKey = process.env.INTERNAL_API_KEY;
  const authorization = request.headers.get('authorization');
  const internalHeader = request.headers.get('x-internal-api-key');

  return Boolean(
    (cronSecret && authorization === `Bearer ${cronSecret}`) ||
    (internalKey && internalHeader === internalKey)
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada.' },
      { status: 500 }
    );
  }

  const { data, error } = await (admin as any).rpc('expire_pending_orders', {
    p_limit: 200,
  });

  if (error) {
    appLogger.error('orders.expiration.failed', { error: error.message });
    return NextResponse.json({ error: 'No se pudieron vencer los pedidos.' }, { status: 500 });
  }

  appLogger.info('orders.expiration.completed', { expired: Number(data || 0) });
  return NextResponse.json({ success: true, expired: Number(data || 0) });
}
