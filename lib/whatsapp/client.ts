import { requireWhatsAppCloudConfig } from '@/lib/whatsapp/config';
import {
  claimWhatsAppDelivery,
  completeWhatsAppDelivery,
} from '@/lib/whatsapp/delivery';
import { normalizeWhatsAppRecipient } from '@/lib/whatsapp/phone';

export interface WhatsAppTemplateComponent {
  parameters?: Array<Record<string, unknown>>;
  sub_type?: string;
  type: 'body' | 'button' | 'header';
  index?: string;
}

export async function sendWhatsAppTemplate({
  components = [],
  eventKey,
  languageCode = 'es',
  templateName,
  to,
}: {
  components?: WhatsAppTemplateComponent[];
  eventKey: string;
  languageCode?: string;
  templateName: string;
  to: string;
}) {
  const config = requireWhatsAppCloudConfig();
  const recipient = normalizeWhatsAppRecipient(to);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 ? { components } : {}),
    },
  };
  const claim = await claimWhatsAppDelivery({
    eventKey,
    payload,
    recipient,
    templateName,
  });
  if (claim.skip) return { skipped: true };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
      {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      }
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = body?.error?.code || response.status;
      throw new Error(`WHATSAPP_API_ERROR_${code}`);
    }
    const providerMessageId = body?.messages?.[0]?.id || null;
    await completeWhatsAppDelivery({
      logId: claim.logId,
      providerMessageId,
      status: 'sent',
    });
    return { providerMessageId, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WHATSAPP_API_ERROR';
    await completeWhatsAppDelivery({
      error: message,
      logId: claim.logId,
      status: 'failed',
    });
    throw error;
  }
}

