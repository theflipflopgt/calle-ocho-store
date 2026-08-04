import { createAdminClient } from '@/lib/supabase/admin';

interface WhatsAppClaim {
  logId: string | null;
  skip: boolean;
}

export async function claimWhatsAppDelivery({
  eventKey,
  recipient,
  templateName,
  payload,
}: {
  eventKey: string;
  recipient: string;
  templateName: string;
  payload: Record<string, unknown>;
}): Promise<WhatsAppClaim> {
  const admin = createAdminClient();
  if (!admin) return { logId: null, skip: false };

  const { data: inserted, error } = await (admin as any)
    .from('whatsapp_message_logs')
    .insert({
      direction: 'outbound',
      event_key: eventKey,
      recipient,
      template_name: templateName,
      message_type: 'template',
      status: 'pending',
      attempts: 1,
      payload,
    })
    .select('id')
    .single();

  if (!error && inserted) return { logId: inserted.id, skip: false };

  const { data: existing } = await (admin as any)
    .from('whatsapp_message_logs')
    .select('id,status,attempts,updated_at')
    .eq('event_key', eventKey)
    .eq('recipient', recipient)
    .maybeSingle();

  if (!existing) return { logId: null, skip: false };
  if (['sent', 'delivered', 'read'].includes(existing.status)) {
    return { logId: existing.id, skip: true };
  }
  if (
    existing.status === 'pending' &&
    Date.now() - new Date(existing.updated_at).getTime() < 10 * 60 * 1000
  ) {
    return { logId: existing.id, skip: true };
  }

  await (admin as any)
    .from('whatsapp_message_logs')
    .update({
      attempts: Number(existing.attempts || 0) + 1,
      last_error: null,
      payload,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  return { logId: existing.id, skip: false };
}

export async function completeWhatsAppDelivery({
  error,
  logId,
  providerMessageId,
  status,
}: {
  error?: string | null;
  logId: string | null;
  providerMessageId?: string | null;
  status: 'failed' | 'sent' | 'skipped';
}) {
  if (!logId) return;
  const admin = createAdminClient();
  if (!admin) return;
  await (admin as any)
    .from('whatsapp_message_logs')
    .update({
      last_error: error || null,
      provider_message_id: providerMessageId || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

