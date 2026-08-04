import { createAdminClient } from '@/lib/supabase/admin';

const knownStatuses = new Set(['sent', 'delivered', 'read', 'failed']);

function unixTimestampToIso(value: unknown) {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
}

export async function recordWhatsAppWebhookEvents(payload: any) {
  const admin = createAdminClient();
  if (!admin) throw new Error('SUPABASE_ADMIN_NOT_CONFIGURED');

  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      const value = change?.value || {};

      for (const message of value.messages || []) {
        if (!message?.id || !message?.from) continue;
        const contact = (value.contacts || []).find(
          (candidate: any) => candidate?.wa_id === message.from
        );
        await (admin as any).from('whatsapp_message_logs').upsert(
          {
            direction: 'inbound',
            message_type: message.type || 'unknown',
            payload: {
              contact: contact || null,
              message,
              metadata: value.metadata || null,
            },
            provider_message_id: message.id,
            received_at: unixTimestampToIso(message.timestamp) || new Date().toISOString(),
            recipient: message.from,
            status: 'received',
            updated_at: new Date().toISOString(),
          },
          { ignoreDuplicates: true, onConflict: 'provider_message_id' }
        );
      }

      for (const statusEvent of value.statuses || []) {
        if (!statusEvent?.id || !knownStatuses.has(statusEvent.status)) continue;
        const timestamp = unixTimestampToIso(statusEvent.timestamp) || new Date().toISOString();
        const updates: Record<string, unknown> = {
          payload: statusEvent,
          status: statusEvent.status,
          updated_at: new Date().toISOString(),
        };
        if (statusEvent.status === 'delivered') updates.delivered_at = timestamp;
        if (statusEvent.status === 'read') updates.read_at = timestamp;
        if (statusEvent.status === 'failed') {
          updates.last_error = String(statusEvent.errors?.[0]?.code || 'WHATSAPP_DELIVERY_FAILED');
        }

        const { data: updated } = await (admin as any)
          .from('whatsapp_message_logs')
          .update(updates)
          .eq('provider_message_id', statusEvent.id)
          .select('id')
          .maybeSingle();

        if (!updated) {
          await (admin as any).from('whatsapp_message_logs').upsert(
            {
              ...updates,
              direction: 'outbound',
              message_type: 'unknown',
              provider_message_id: statusEvent.id,
              recipient: statusEvent.recipient_id || 'unknown',
            },
            { ignoreDuplicates: true, onConflict: 'provider_message_id' }
          );
        }
      }
    }
  }
}

