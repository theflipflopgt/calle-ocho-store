'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ChevronDown, Loader2, Package, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InventoryProductListProps {
  groups: any[];
  isAdmin: boolean;
}

export function InventoryProductList({ groups, isAdmin }: InventoryProductListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const archivedIds = useMemo(
    () => groups.filter((group) => group.product?.status === 'archived').map((group) => group.id),
    [groups]
  );

  const toggleSelected = (productId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    setMessage(null);
  };

  const selectArchived = () => {
    setSelected(new Set(archivedIds));
    setMessage(null);
  };

  const clearSelection = () => {
    setSelected(new Set());
    setMessage(null);
  };

  const publishSelected = async () => {
    const productIds = [...selected];
    if (productIds.length === 0 || publishing) return;

    const confirmed = window.confirm(
      `Vas a publicar ${productIds.length} producto${productIds.length === 1 ? '' : 's'} en la tienda. ` +
        'Confirma que ya revisaste imagenes, precio, tallas y stock.'
    );
    if (!confirmed) return;

    setPublishing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/products/publish-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudieron publicar los productos.');
      }

      setMessage(
        `${payload.published ?? productIds.length} producto${(payload.published ?? productIds.length) === 1 ? '' : 's'} publicado${(payload.published ?? productIds.length) === 1 ? '' : 's'} correctamente.`
      );
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron publicar los productos.');
    } finally {
      setPublishing(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-12 text-center text-gray-500">
          <Package className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>No hay productos para este filtro.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {isAdmin && archivedIds.length > 0 && (
        <div className="border-b border-gray-200 bg-slate-50 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold text-brand-black">
                <Archive className="h-4 w-4" />
                Preparacion antes de publicar
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Los productos nuevos de carga masiva quedan archivados. Selecciona solo los que ya revisaste y publicalos cuando esten listos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectArchived} disabled={publishing}>
                Seleccionar archivados ({archivedIds.length})
              </Button>
              {selected.size > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={publishing}>
                  Limpiar
                </Button>
              )}
              <Button type="button" size="sm" onClick={publishSelected} disabled={selected.size === 0 || publishing}>
                {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publicar seleccionados ({selected.size})
              </Button>
            </div>
          </div>
          {message && (
            <p className={`mt-3 text-sm ${message.includes('correctamente') ? 'text-green-700' : 'text-red-700'}`}>
              {message}
            </p>
          )}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {groups.map((group: any) => {
          const totalStock = group.variants.reduce(
            (sum: number, variant: any) => sum + Number(variant.stock_quantity || 0),
            0
          );
          const colors = new Set(
            group.variants.map((variant: any) => variant.product_colors?.color_name).filter(Boolean)
          );
          const hasAvailableStock = group.variants.some(
            (variant: any) => Number(variant.stock_quantity || 0) > 0
          );
          const isArchived = group.product?.status === 'archived';
          const isActive = group.product?.status === 'active';

          return (
            <details key={group.id} className="group">
              <summary className="grid cursor-pointer list-none gap-3 px-4 py-4 hover:bg-gray-50 sm:grid-cols-[auto_minmax(0,2fr)_1fr_1fr_1fr_auto] sm:items-center sm:px-6">
                <div className="flex items-center" onClick={(event) => event.stopPropagation()}>
                  {isAdmin && isArchived ? (
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${group.product?.name || 'producto'}`}
                      checked={selected.has(group.id)}
                      onChange={() => toggleSelected(group.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                    />
                  ) : (
                    <span className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-brand-black">
                      {group.product?.name || 'Producto eliminado'}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : isArchived
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {isActive ? 'Activo' : isArchived ? 'Archivado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{group.product?.sku}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {colors.size} {colors.size === 1 ? 'color' : 'colores'}
                </p>
                <p className="text-sm text-gray-600">
                  {group.variants.length} {group.variants.length === 1 ? 'talla' : 'tallas'}
                </p>
                <div>
                  <p className="font-semibold text-brand-black">{totalStock} pares</p>
                  <p className={`text-xs ${hasAvailableStock ? 'text-green-700' : 'text-red-600'}`}>
                    {hasAvailableStock ? 'Con existencias' : 'Agotado'}
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" />
              </summary>

              <div className="overflow-x-auto border-t border-gray-100 bg-gray-50/60">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Color</th>
                      <th className="px-6 py-3 text-left font-medium">Talla</th>
                      <th className="px-6 py-3 text-left font-medium">SKU</th>
                      <th className="px-6 py-3 text-right font-medium">Stock</th>
                      <th className="px-6 py-3 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {group.variants.map((variant: any) => {
                      const isOut = Number(variant.stock_quantity || 0) === 0;
                      const isLow =
                        !isOut &&
                        Number(variant.stock_quantity || 0) < Number(variant.low_stock_threshold || 5);
                      return (
                        <tr key={variant.id} className={isOut ? 'bg-red-50/40' : ''}>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-4 w-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: variant.product_colors?.color_code || '#ffffff' }}
                              />
                              {variant.product_colors?.color_name || 'Sin color'}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-medium">
                            US {variant.size_us}{' '}
                            <span className="ml-2 text-gray-500">EU {variant.size_eu}</span>
                          </td>
                          <td className="px-6 py-3">
                            <code className="rounded bg-gray-100 px-2 py-1 text-xs">{variant.sku}</code>
                          </td>
                          <td
                            className={`px-6 py-3 text-right font-bold ${
                              isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-700'
                            }`}
                          >
                            {variant.stock_quantity}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                isOut
                                  ? 'bg-red-100 text-red-800'
                                  : isLow
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {isOut ? 'Agotado' : isLow ? 'Stock bajo' : 'Disponible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
