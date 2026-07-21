'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { generateSlug } from '@/lib/utils/slug';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createBrand, updateBrand } from './actions';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  country: string | null;
  website_url: string | null;
  is_active: boolean | null;
}

interface BrandFormProps {
  brand?: Brand;
}

export function BrandForm({ brand }: BrandFormProps) {
  const isEditing = !!brand;

  const [formData, setFormData] = useState({
    name: brand?.name || '',
    slug: brand?.slug || '',
    logo_url: brand?.logo_url || '',
    description: brand?.description || '',
    country: brand?.country || '',
    website_url: brand?.website_url || '',
    is_active: brand?.is_active ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const brandData = {
      name: formData.name,
      slug: formData.slug,
      logo_url: formData.logo_url || null,
      description: formData.description || null,
      country: formData.country || null,
      website_url: formData.website_url || null,
      is_active: formData.is_active,
    };

    const result = isEditing
      ? await updateBrand(brand.id, brandData)
      : await createBrand(brandData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nike"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="nike"
            required
          />
          <p className="text-xs text-gray-500">
            URL amigable: /marcas/{formData.slug || 'slug'}
          </p>
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <Label htmlFor="logo_url">URL del Logo</Label>
          <Input
            id="logo_url"
            type="url"
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://..."
          />
          {formData.logo_url && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <img
                src={formData.logo_url}
                alt="Preview"
                className="max-h-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción de la marca..."
            rows={3}
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">País de Origen</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Estados Unidos"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="website_url">Sitio Web</Label>
          <Input
            id="website_url"
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            placeholder="https://www.nike.com"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_active">Marca Activa</Label>
            <p className="text-sm text-gray-600">
              Las marcas inactivas no se muestran en la tienda
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/admin/marcas">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-brand-blue hover:bg-brand-blue/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Guardando...' : 'Creando...'}
            </>
          ) : isEditing ? (
            'Guardar Cambios'
          ) : (
            'Crear Marca'
          )}
        </Button>
      </div>
    </form>
  );
}
