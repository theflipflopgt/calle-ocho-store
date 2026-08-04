'use client';

import { useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Shipment {
  id: string;
  carrier: string;
  service: string | null;
  status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_cost: number | null;
}

export function ShipmentManager({ orderId, shipment }: { orderId: string; shipment?: Shipment | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch('/api/admin/shipments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, orderId, shipmentId: shipment?.id || null }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setError(result.error || 'No se pudo guardar el envío.');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-brand-black"><Truck className="h-5 w-5" />Envío</h2>
      <div><Label htmlFor="carrier">Transportista</Label><Input id="carrier" name="carrier" defaultValue={shipment?.carrier || 'Guatex'} required /></div>
      <div><Label htmlFor="service">Servicio</Label><Input id="service" name="service" defaultValue={shipment?.service || ''} /></div>
      <div>
        <Label htmlFor="shipmentStatus">Estado</Label>
        <select id="shipmentStatus" name="status" defaultValue={shipment?.status || 'pending'} className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="pending">Pendiente</option><option value="ready">Listo</option>
          <option value="shipped">Enviado</option><option value="in_transit">En tránsito</option>
          <option value="delivered">Entregado</option><option value="exception">Incidencia</option>
          <option value="returned">Retornado</option><option value="cancelled">Cancelado</option>
        </select>
      </div>
      <div><Label htmlFor="trackingNumber">Número de guía</Label><Input id="trackingNumber" name="trackingNumber" defaultValue={shipment?.tracking_number || ''} /></div>
      <div><Label htmlFor="trackingUrl">URL de seguimiento</Label><Input id="trackingUrl" name="trackingUrl" type="url" defaultValue={shipment?.tracking_url || ''} /></div>
      <div><Label htmlFor="shippingCost">Costo real</Label><Input id="shippingCost" name="shippingCost" type="number" min="0" step="0.01" defaultValue={shipment?.shipping_cost ?? ''} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar envío</Button>
    </form>
  );
}
