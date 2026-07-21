'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import type { OrderStatus } from '@/types/order-workflow';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusFlow = [
  { value: 'pending' as OrderStatus, label: 'Pendiente', description: 'Esperando pago' },
  { value: 'paid' as OrderStatus, label: 'Pagado', description: 'Pago recibido' },
  { value: 'processing' as OrderStatus, label: 'Procesando', description: 'Preparando envío' },
  { value: 'shipped' as OrderStatus, label: 'Enviado', description: 'En camino' },
  { value: 'delivered' as OrderStatus, label: 'Entregado', description: 'Recibido por cliente' },
];

export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const currentIndex = statusFlow.findIndex((s) => s.value === status);
  const isCancelled = ['cancelled', 'refunded'].includes(status);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setIsLoading(true);
    setSuccess(false);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          note: note || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el estado');
      }

      setStatus(newStatus);
      setSuccess(true);
      setNote('');
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar el estado');
      console.error('Error updating order status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-brand-black mb-4">Estado de la Orden</h2>
        <div className="text-center py-4">
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
            {status === 'cancelled' ? 'Cancelada' : 'Reembolsada'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-brand-black mb-4">Estado de la Orden</h2>

      {/* Status Flow */}
      <div className="space-y-3 mb-6">
        {statusFlow.map((s, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = s.value === status;
          const isNext = index === currentIndex + 1;

          return (
            <div
              key={s.value}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'border-brand-blue bg-blue-50'
                  : isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-gray-500">{s.description}</p>
              </div>
              {isNext && !isLoading && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(s.value)}
                  className="bg-brand-blue hover:bg-brand-blue/90"
                >
                  Marcar
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Tracking Info (show when about to ship) */}
      {status === 'processing' && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium">Información de Envío</h3>
          <div className="space-y-2">
            <Label htmlFor="tracking" className="text-xs">
              Número de Tracking
            </Label>
            <Input
              id="tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Número de guía"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingUrl" className="text-xs">
              URL de Seguimiento
            </Label>
            <Input
              id="trackingUrl"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        <Label htmlFor="statusNote" className="text-xs">Nota interna del cambio (opcional)</Label>
        <Input
          id="statusNote"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ej: Cliente confirmó recepción por WhatsApp"
        />
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2 mb-4">
          <CheckCircle className="h-4 w-4" />
          Estado actualizado correctamente
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
          {errorMessage}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
        </div>
      )}

      {/* Cancel Actions */}
      {!['delivered', 'cancelled', 'refunded'].includes(status) && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Acciones adicionales:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={isLoading}
            >
              Cancelar Orden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
