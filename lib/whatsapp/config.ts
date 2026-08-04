const DEFAULT_GRAPH_API_VERSION = 'v25.0';

export interface WhatsAppCloudConfig {
  accessToken: string;
  appSecret: string;
  businessAccountId: string;
  graphApiVersion: string;
  phoneNumberId: string;
  verifyToken: string;
}

function env(name: string) {
  return process.env[name]?.trim() || '';
}

export function getWhatsAppCloudReadiness() {
  const graphApiVersion = /^v\d+\.\d+$/.test(env('WHATSAPP_GRAPH_API_VERSION'))
    ? env('WHATSAPP_GRAPH_API_VERSION')
    : DEFAULT_GRAPH_API_VERSION;
  const values = {
    accessToken: env('WHATSAPP_ACCESS_TOKEN'),
    appSecret: env('WHATSAPP_APP_SECRET'),
    businessAccountId: env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    graphApiVersion,
    phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'),
    verifyToken: env('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
  };
  const configured = Object.entries(values)
    .filter(([key]) => key !== 'graphApiVersion')
    .every(([, value]) => Boolean(value));
  const explicitlyEnabled = env('WHATSAPP_CLOUD_API_ENABLED') === 'true';

  return {
    configured,
    enabled: explicitlyEnabled && configured,
    graphApiVersion,
    values,
  };
}

export function requireWhatsAppCloudConfig(): WhatsAppCloudConfig {
  const readiness = getWhatsAppCloudReadiness();
  if (!readiness.enabled) throw new Error('WHATSAPP_CLOUD_API_NOT_CONFIGURED');
  return readiness.values;
}

