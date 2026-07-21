export interface NeoPayReadiness {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  missing: string[];
}

const REQUIRED_SERVER_ENV = [
  'NEOPAY_MERCHANT_ID',
  'NEOPAY_TERMINAL_ID',
  'NEOPAY_API_URL',
  'NEOPAY_API_KEY',
  'NEOPAY_WEBHOOK_SECRET',
] as const;

export function getNeoPayReadiness(): NeoPayReadiness {
  const missing = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]?.trim());
  const explicitlyEnabled = process.env.NEOPAY_ENABLED === 'true';
  const environment = process.env.NEOPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  return {
    enabled: explicitlyEnabled && missing.length === 0,
    environment,
    missing: [...missing],
  };
}

export function assertNeoPayReady(): NeoPayReadiness {
  const readiness = getNeoPayReadiness();
  if (!readiness.enabled) {
    throw new Error('NEOPAY_NOT_CONFIGURED');
  }
  return readiness;
}
