'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface PaymentMethod {
  code: string;
  label: string;
  description: string;
  provider: string;
  is_enabled: boolean;
  requires_payment_link: boolean;
  supports_installments: boolean;
}

export function PaymentMethodsPanel() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMethods() {
      const response = await fetch('/api/admin/payment-methods', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'No se pudieron cargar los métodos.');
      } else {
        setMethods(data.methods || []);
      }

      setLoading(false);
    }

    void loadMethods();
  }, []);

  const toggleMethod = async (code: string, isEnabled: boolean) => {
    setSavingCode(code);
    setError(null);

    const previous = methods;
    setMethods((current) =>
      current.map((method) =>
        method.code === code ? { ...method, is_enabled: isEnabled } : method
      )
    );

    const response = await fetch('/api/admin/payment-methods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, isEnabled }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMethods(previous);
      setError(data?.error || 'No se pudo guardar el cambio.');
    }

    setSavingCode(null);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          <CreditCard className="h-5 w-5 text-brand-black" />
        </div>
        <div>
          <h2 className="font-semibold text-brand-black">Métodos de pago visibles</h2>
          <p className="text-sm text-gray-600">
            Activa u oculta opciones del checkout. Neo Link genera orden pendiente y se coordina por WhatsApp.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando métodos...
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {methods.map((method) => (
            <div key={method.code} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-brand-black">{method.label}</p>
                  {method.requires_payment_link && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-brand-blue">
                      Requiere link
                    </span>
                  )}
                  {method.supports_installments && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Cuotas
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{method.description}</p>
              </div>
              <Switch
                checked={method.is_enabled}
                disabled={savingCode === method.code}
                onCheckedChange={(checked) => toggleMethod(method.code, checked)}
                aria-label={`Activar ${method.label}`}
                className="data-[state=checked]:bg-brand-blue"
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
