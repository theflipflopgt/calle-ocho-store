'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ReturnStatusEditor({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState(status);

  const save = async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/returns/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    if (response.ok) router.refresh();
  };

  return <div className="flex items-center gap-2"><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"><option value="requested">Solicitada</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option><option value="received">Recibida</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select><Button size="sm" onClick={save} disabled={loading || nextStatus === status}>Guardar</Button></div>;
}
