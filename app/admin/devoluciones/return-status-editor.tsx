'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ReturnStatusEditor({
  id,
  status,
  resolutionNotes,
}: {
  id: string;
  status: string;
  resolutionNotes: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState(status);
  const [notes, setNotes] = useState(resolutionNotes);
  const [error, setError] = useState('');

  const save = async () => {
    setLoading(true);
    setError('');
    const response = await fetch(`/api/admin/returns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, resolutionNotes: notes }),
    });
    setLoading(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error || 'No se pudo guardar la gestión.');
      return;
    }
    router.refresh();
  };

  const unchanged = nextStatus === status && notes === resolutionNotes;

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
      <label className="block text-sm font-medium text-gray-700">
        Estado
        <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-2 font-normal">
          <option value="requested">Solicitada</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
          <option value="received">Recibida</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Resolución / seguimiento
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Ej. producto recibido; se autoriza cambio a talla 9" className="mt-1 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="sm" onClick={save} disabled={loading || unchanged} className="w-full">
        {loading ? 'Guardando...' : 'Guardar seguimiento'}
      </Button>
    </div>
  );
}
