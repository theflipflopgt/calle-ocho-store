import { NextResponse } from 'next/server';
import { getNeoPayReadiness } from '@/lib/payments/neopay/config';

export async function GET() {
  const readiness = getNeoPayReadiness();
  return NextResponse.json(
    {
      enabled: readiness.enabled,
      environment: readiness.environment,
      message: readiness.enabled
        ? 'NeoPay está configurado en el servidor.'
        : 'NeoPay permanece desactivado hasta completar credenciales y certificación.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
