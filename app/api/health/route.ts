import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { status: 'degraded', database: false, latencyMs: Date.now() - startedAt },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { error } = await (admin as any).from('payment_methods').select('id').limit(1);
  const healthy = !error;
  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', database: healthy, latencyMs: Date.now() - startedAt },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
