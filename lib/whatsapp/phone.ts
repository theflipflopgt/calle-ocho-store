export function normalizeWhatsAppRecipient(value: string, countryCode = '502') {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 8) digits = `${countryCode}${digits}`;
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new Error('INVALID_WHATSAPP_RECIPIENT');
  }
  return digits;
}

