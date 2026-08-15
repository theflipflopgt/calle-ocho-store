'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewRow {
  rowNumber: number;
  action: 'create_product' | 'update_product' | 'update_variant' | 'skip';
  normalized: Record<string, any>;
  errors: string[];
  warnings: string[];
}

interface PreviewResult {
  batchId: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: PreviewRow[];
}

const actionLabels: Record<PreviewRow['action'], string> = {
  create_product: 'Crear producto',
  update_product: 'Actualizar producto',
  update_variant: 'Actualizar variante',
  skip: 'No importar',
};

export function InventoryImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async (file?: File) => {
    if (!file) return;

    setSelectedFileName(file.name);
    setPreview(null);
    setMessage(null);
    setError(null);
    setIsPreviewing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/inventory-import/preview', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo revisar el Excel.');
      }

      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revisar el Excel.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;

    setIsCommitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/inventory-import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: preview.batchId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo guardar la importacion.');
      }

      setMessage(`Importacion completada: ${result.processed} filas guardadas, ${result.skipped} omitidas.`);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la importacion.');
    } finally {
      setIsCommitting(false);
    }
  };

  const canCommit = !!preview && preview.validRows > 0 && preview.errorRows === 0;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
            <h2 className="font-semibold text-brand-black">Carga masiva por Excel</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Descarga la plantilla, completa productos/tallas/stock/Cloudinary y revisa antes de guardar. Los productos nuevos se importan archivados para que puedas prepararlos antes de publicarlos.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/api/admin/inventory-import/template">
            <Button variant="outline" className="w-full sm:w-auto">
              Descargar plantilla
            </Button>
          </Link>
          <Button
            type="button"
            className="w-full bg-brand-blue hover:bg-brand-blue/90 sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPreviewing}
          >
            {isPreviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Revisar Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(event) => void handlePreview(event.target.files?.[0])}
          />
        </div>
      </div>

      {selectedFileName && (
        <p className="mt-3 text-xs text-gray-500">Archivo seleccionado: {selectedFileName}</p>
      )}

      {message && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {preview && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ImportStat label="Filas leidas" value={preview.totalRows} />
            <ImportStat label="Listas para subir" value={preview.validRows} tone="success" />
            <ImportStat label="Con errores" value={preview.errorRows} tone={preview.errorRows > 0 ? 'danger' : 'neutral'} />
          </div>

          {preview.errorRows > 0 && (
            <div className="flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Corrige las filas con error en el Excel y vuelve a revisarlo. No se guardara nada hasta que confirmes.
            </div>
          )}

          {preview.errorRows === 0 && (
            <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Los productos nuevos quedaran archivados aunque el Excel indique active. Los productos que ya existen conservaran su estado actual. Podras publicar los nuevos desde la lista de inventario cuando termines de revisarlos.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Fila</th>
                    <th className="px-3 py-2 text-left">Accion</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">Talla</th>
                    <th className="px-3 py-2 text-left">Stock</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Precio</th>
                    <th className="px-3 py-2 text-left">Imagen</th>
                    <th className="px-3 py-2 text-left">Revision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {preview.rows.slice(0, 80).map((row) => (
                    <tr key={row.rowNumber} className={row.errors.length ? 'bg-red-50/50' : ''}>
                      <td className="px-3 py-2 font-medium">{row.rowNumber}</td>
                      <td className="px-3 py-2">{actionLabels[row.action]}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-brand-black">{row.normalized.nombre}</div>
                        <div className="text-xs text-gray-500">{row.normalized.codigo_producto}</div>
                      </td>
                      <td className="px-3 py-2">US {row.normalized.talla_us}</td>
                      <td className="px-3 py-2">{row.normalized.stock}</td>
                      <td className="px-3 py-2">{row.normalized.estado}</td>
                      <td className="px-3 py-2">Q {Number(row.normalized.precio_final_calculado || 0).toFixed(2)}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-xs text-gray-500">
                        {row.normalized.link_imagen_cloudinary || '-'}
                      </td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <div className="space-y-1 text-xs text-red-700">
                            {row.errors.map((item) => <p key={item}>{item}</p>)}
                          </div>
                        ) : row.warnings.length > 0 ? (
                          <div className="space-y-1 text-xs text-yellow-700">
                            {row.warnings.map((item) => <p key={item}>{item}</p>)}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Lista
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onClick={() => setPreview(null)} disabled={isCommitting}>
              Cancelar revision
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-blue/90"
              onClick={handleCommit}
              disabled={!canCommit || isCommitting}
            >
              {isCommitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar inventario
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function ImportStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-green-700'
      : tone === 'danger'
        ? 'text-red-700'
        : 'text-brand-black';

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
