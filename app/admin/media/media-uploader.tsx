'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm',
]);

export function MediaUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const chooseFile = (selected: File | null) => {
    setError('');
    setUrl('');
    if (!selected) return setFile(null);
    if (!ALLOWED_TYPES.has(selected.type)) {
      setFile(null);
      return setError('Usa JPG, PNG, WebP, AVIF, MP4 o WebM.');
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      return setError('El archivo supera el máximo de 20 MB.');
    }
    setFile(selected);
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError('');
    try {
      const signatureResponse = await fetch('/api/admin/media/signature', { method: 'POST' });
      const signed = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signed.error || 'No se pudo firmar la carga.');

      const body = new FormData();
      body.set('file', file);
      body.set('api_key', signed.apiKey);
      body.set('timestamp', String(signed.timestamp));
      body.set('folder', signed.folder);
      body.set('signature', signed.signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`,
        { method: 'POST', body }
      );
      const result = await response.json();
      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || 'Cloudinary rechazó la carga.');
      }

      setUrl(result.secure_url);
      setFile(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo cargar el archivo.');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-brand-black">Carga firmada a Cloudinary</h2>
      <p className="mt-1 text-sm text-gray-600">
        El archivo se valida antes de subirlo. La clave secreta permanece en el servidor.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          disabled={uploading}
          onChange={(event) => chooseFile(event.target.files?.[0] || null)}
        />
        <Button onClick={upload} disabled={!file || uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Subir
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {url && (
        <div className="mt-4 flex items-center gap-2">
          <Input value={url} readOnly aria-label="URL cargada" />
          <Button variant="outline" size="icon" onClick={copyUrl} aria-label="Copiar URL">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </section>
  );
}
