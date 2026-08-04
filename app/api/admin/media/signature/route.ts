import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';

export async function POST() {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary no está configurado para cargas firmadas.' },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'calle-ocho-store';
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
