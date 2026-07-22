'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SyncAuthUsersButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncUsers = async () => {
    setIsSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/sync-auth', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo sincronizar.');
      }

      setMessage(
        `${result.synced || 0} usuarios sincronizados: ${result.inserted || 0} nuevos, ${result.updated || 0} actualizados.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" variant="outline" onClick={syncUsers} disabled={isSyncing}>
        {isSyncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="mr-2 h-4 w-4" />
        )}
        Sincronizar usuarios
      </Button>
      {message && <p className="text-xs text-green-700">{message}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
