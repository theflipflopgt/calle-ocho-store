'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/constants/business';

interface PaymentLinkManagerProps {
  orderId: string;
  orderNumber: string;
  customerPhone?: string | null;
  initialPaymentLinkUrl?: string | null;
  paymentLinkSentAt?: string | null;
  paymentMethod: string;
}

const methodLabels: Record<string, string> = {
  neo_link_direct: 'Neo Link pago directo',
  neo_link_installments: 'Neo Link con cuotas',
};

function cleanPhone(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 8) return `502${digits}`;
  return digits || BUSINESS_WHATSAPP_NUMBER;
}

export function PaymentLinkManager({
  orderId,
  orderNumber,
  customerPhone,
  initialPaymentLinkUrl,
  paymentLinkSentAt,
  paymentMethod,
}: PaymentLinkManagerProps) {
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(initialPaymentLinkUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const whatsappText = encodeURIComponent(
    `Hola, te compartimos el link de pago de calleOCHO para tu pedido ${orderNumber}: ${paymentLinkUrl}`
  );
  const whatsappHref = `https://wa.me/${cleanPhone(customerPhone)}?text=${whatsappText}`;

  const saveLink = async (markAsSent: boolean) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/orders/${orderId}/payment-link`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentLinkUrl, markAsSent }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'No se pudo guardar el link.');
    } else {
      setSuccess(markAsSent ? 'Link marcado como enviado.' : 'Link guardado.');
      router.refresh();
    }

    setIsSaving(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-1 font-semibold text-brand-black">Neo Link</h2>
      <p className="mb-4 text-sm text-gray-600">
        {methodLabels[paymentMethod] || 'Link de pago'}: pega aquí el enlace generado en NeoNet y envíalo por WhatsApp.
      </p>

      <div className="space-y-2">
        <Label htmlFor="paymentLinkUrl">Link HTTPS de pago</Label>
        <Input
          id="paymentLinkUrl"
          value={paymentLinkUrl}
          onChange={(event) => setPaymentLinkUrl(event.target.value)}
          placeholder="https://..."
        />
      </div>

      {paymentLinkSentAt && (
        <p className="mt-2 text-xs text-green-700">
          Enviado el {new Date(paymentLinkSentAt).toLocaleString('es-GT')}.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-700">{success}</p>}

      <div className="mt-4 grid gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => saveLink(false)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar link
        </Button>
        <Button
          type="button"
          className="bg-green-600 hover:bg-green-700"
          disabled={isSaving || !paymentLinkUrl}
          onClick={() => saveLink(true)}
        >
          <Send className="mr-2 h-4 w-4" />
          Marcar enviado
        </Button>
        {paymentLinkUrl ? (
          <Button asChild type="button" variant="outline">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir WhatsApp
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
