'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatPrice } from '@/lib/utils/currency';

interface OfferButtonProps {
  productId: string;
  productName: string;
  basePrice: number;
  compareAtPrice: number | null;
}

export function OfferButton({
  productId,
  productName,
  basePrice,
  compareAtPrice,
}: OfferButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isOffer = Boolean(compareAtPrice && compareAtPrice > basePrice);
  const [oldPrice, setOldPrice] = useState(String(compareAtPrice || basePrice || ''));
  const [newPrice, setNewPrice] = useState(String(basePrice || ''));

  const discountLabel = useMemo(() => {
    const oldPriceNumber = Number(oldPrice);
    const newPriceNumber = Number(newPrice);

    if (!oldPriceNumber || !newPriceNumber || oldPriceNumber <= newPriceNumber) {
      return null;
    }

    const discount = Math.round((1 - newPriceNumber / oldPriceNumber) * 100);
    return `${discount}% de descuento`;
  }, [oldPrice, newPrice]);

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/offer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          compareAtPrice: oldPrice,
          basePrice: newPrice,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error || 'No se pudo guardar la oferta.');
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeOffer() {
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/offer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error || 'No se pudo quitar la oferta.');
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={isOffer ? 'secondary' : 'ghost'}
          size="sm"
          title={isOffer ? 'Editar oferta' : 'Enviar a ofertas'}
          className={isOffer ? 'text-brand-red' : ''}
        >
          <Percent className="h-4 w-4" />
          <span className="hidden lg:inline">{isOffer ? 'Oferta' : 'Ofertas'}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enviar a Ofertas</AlertDialogTitle>
          <AlertDialogDescription>
            {productName} aparecerá en la sección Ofertas cuando tenga precio anterior y un nuevo precio menor.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={saveOffer} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`old-price-${productId}`}>Precio anterior</Label>
              <Input
                id={`old-price-${productId}`}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={oldPrice}
                onChange={(event) => setOldPrice(event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`new-price-${productId}`}>Nuevo precio</Label>
              <Input
                id={`new-price-${productId}`}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Precio actual: <strong>{formatPrice(basePrice)}</strong>
            {discountLabel ? <span className="ml-2 text-brand-red">{discountLabel}</span> : null}
          </div>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <AlertDialogFooter>
            {isOffer ? (
              <Button
                type="button"
                variant="outline"
                onClick={removeOffer}
                disabled={isSaving}
              >
                Quitar oferta
              </Button>
            ) : null}
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar oferta'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
