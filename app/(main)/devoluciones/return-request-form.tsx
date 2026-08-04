'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ReturnRequestForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch('/api/returns/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setError(result.error || 'No se pudo enviar la solicitud.');
    setMessage('Solicitud recibida. Nuestro equipo revisará el pedido y te contactará.');
    formElement.reset();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-brand-black">Solicitar cambio o devolución</h2>
      <div><Label htmlFor="orderNumber">Número de pedido</Label><Input id="orderNumber" name="orderNumber" required /></div>
      <div><Label htmlFor="contact">Correo o teléfono de la compra</Label><Input id="contact" name="contact" required /></div>
      <div>
        <Label htmlFor="requestType">Tipo de solicitud</Label>
        <select id="requestType" name="requestType" required className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="size_exchange">Cambio de talla</option>
          <option value="return">Devolución</option>
          <option value="damaged_item">Producto dañado</option>
          <option value="wrong_item">Producto incorrecto</option>
        </select>
      </div>
      <div><Label htmlFor="reason">Describe el caso</Label><Textarea id="reason" name="reason" minLength={10} maxLength={1000} required /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar solicitud</Button>
    </form>
  );
}
