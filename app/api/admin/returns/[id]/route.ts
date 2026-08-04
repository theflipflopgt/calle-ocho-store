import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Solo administrador' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const { error } = await (auth.supabase as any).rpc('admin_update_return_request', {
    p_request_id: id,
    p_status: String(body?.status || ''),
    p_resolution_notes: String(body?.resolutionNotes || '') || null,
  });

  if (error) return NextResponse.json({ error: 'No se pudo actualizar la solicitud.' }, { status: 400 });
  return NextResponse.json({ success: true });
}
