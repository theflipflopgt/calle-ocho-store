import { NextResponse } from 'next/server';
import { getWhatsAppCloudReadiness } from '@/lib/whatsapp/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = getWhatsAppCloudReadiness();
  return NextResponse.json(
    {
      configured: readiness.configured,
      enabled: readiness.enabled,
      graphApiVersion: readiness.graphApiVersion,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

