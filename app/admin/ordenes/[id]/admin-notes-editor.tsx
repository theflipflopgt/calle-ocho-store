'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AdminNotesEditorProps {
  orderId: string;
  initialNotes: string;
}

export function AdminNotesEditor({ orderId, initialNotes }: AdminNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo guardar la nota');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la nota');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-brand-black mb-4">Notas Internas</h2>
      <textarea
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
        rows={4}
        placeholder="Notas internas del equipo..."
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {saved && <p className="text-xs text-green-600 mt-2">Notas guardadas</p>}

      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar Nota'}
      </Button>
    </div>
  );
}
