'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function WhatsAppBubblePanel() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/storefront-whatsapp', { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) setError(data?.error || 'No se pudo cargar el número.');
        else setPhoneNumber(data.phoneNumber || '');
      })
      .catch(() => setError('No se pudo cargar el número.'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setError(null); setMessage(null);
    const response = await fetch('/api/admin/storefront-whatsapp', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await response.json();
    if (!response.ok) setError(data?.error || 'No se pudo guardar.');
    else { setPhoneNumber(data.phoneNumber); setMessage('Número actualizado. La burbuja usará este número sin volver a desplegar.'); }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
          <MessageCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="font-semibold text-brand-black">WhatsApp de la burbuja</h2>
          <p className="text-sm text-gray-600">Cambia el destino de wa.me sin GitHub, Vercel ni un nuevo despliegue.</p>
        </div>
      </div>
      {loading ? <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div> : (
        <div className="max-w-xl space-y-3">
          <label className="block text-sm font-medium text-gray-800" htmlFor="storefront-whatsapp">Número con código de país</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="storefront-whatsapp" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="50255555555" inputMode="tel" />
            <Button type="button" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar</Button>
          </div>
          <p className="text-xs text-gray-500">Puedes escribir +502 5555 5555; al guardar se conservarán solo los dígitos.</p>
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
