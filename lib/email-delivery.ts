import { createAdminClient } from '@/lib/supabase/admin';

interface EmailClaim {
  skip: boolean;
  logId: string | null;
}

export async function claimEmailDelivery({
  eventKey,
  recipient,
  template,
  metadata = {},
}: {
  eventKey: string;
  recipient: string;
  template: string;
  metadata?: Record<string, unknown>;
}): Promise<EmailClaim> {
  const admin = createAdminClient();
  if (!admin) return { skip: false, logId: null };

  const { data: inserted, error } = await (admin as any)
    .from('email_logs')
    .insert({
      event_key: eventKey,
      recipient,
      template,
      status: 'pending',
      attempts: 1,
      metadata,
    })
    .select('id')
    .single();

  if (!error && inserted) {
    return { skip: false, logId: inserted.id };
  }

  const { data: existing } = await (admin as any)
    .from('email_logs')
    .select('id,status,updated_at,attempts')
    .eq('event_key', eventKey)
    .eq('recipient', recipient)
    .maybeSingle();

  if (!existing) return { skip: false, logId: null };
  if (existing.status === 'sent') {
    return { skip: true, logId: existing.id };
  }
  if (
    existing.status === 'pending' &&
    Date.now() - new Date(existing.updated_at).getTime() < 10 * 60 * 1000
  ) {
    return { skip: true, logId: existing.id };
  }

  await (admin as any)
    .from('email_logs')
    .update({
      status: 'pending',
      attempts: Number(existing.attempts || 0) + 1,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  return { skip: false, logId: existing.id };
}

export async function completeEmailDelivery({
  logId,
  status,
  providerMessageId,
  error,
}: {
  logId: string | null;
  status: 'sent' | 'failed' | 'skipped';
  providerMessageId?: string | null;
  error?: string | null;
}) {
  if (!logId) return;
  const admin = createAdminClient();
  if (!admin) return;

  await (admin as any)
    .from('email_logs')
    .update({
      status,
      provider_message_id: providerMessageId || null,
      last_error: error || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId);
}
