'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils/slug';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

interface CategoryFormProps {
  category?: Category;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = !!category;

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    image_url: category?.image_url || '',
    description: category?.description || '',
    display_order: category?.display_order ?? 0,
    is_active: category?.is_active ?? true,
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

    const supabase = createClient();

    const categoryData = {
      name: formData.name,
      slug: formData.slug,
      image_url: formData.image_url || null,
      description: formData.description || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    if (isEditing) {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', category.id);

      if (error) {
        console.error('Error updating category:', error);
        setError('Error al actualizar la categoría. El slug podría estar duplicado.');
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from('categories').insert(categoryData);

      if (error) {
        console.error('Error creating category:', error);
        setError('Error al crear la categoría. El nombre o slug podría estar duplicado.');
        setIsLoading(false);
        return;
      }
    }

    router.push('/admin/categorias');
    router.refresh();
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
            placeholder="Running"
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
            placeholder="running"
            required
          />
          <p className="text-xs text-gray-500">
            URL amigable: /categorias/{formData.slug || 'slug'}
          </p>
        </div>

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="image_url">URL de Imagen</Label>
          <Input
            id="image_url"
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
          />
          {formData.image_url && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <img
                src={formData.image_url}
                alt="Preview"
                className="max-h-32 object-cover rounded-lg"
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
            placeholder="Descripción de la categoría..."
            rows={3}
          />
        </div>

        {/* Display Order */}
        <div className="space-y-2">
          <Label htmlFor="display_order">Orden de Visualización</Label>
          <Input
            id="display_order"
            type="number"
            min="0"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500">
            Las categorías se ordenan de menor a mayor
          </p>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_active">Categoría Activa</Label>
            <p className="text-sm text-gray-600">
              Las categorías inactivas no se muestran en la tienda
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
        <Link href="/admin/categorias">
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
            'Crear Categoría'
          )}
        </Button>
      </div>
    </form>
  );
}
