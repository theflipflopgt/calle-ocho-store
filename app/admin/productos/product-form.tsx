'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, generateBaseSKU } from '@/lib/utils/slug';
import { Loader2, ArrowLeft, Plus, Trash2, ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text: string | null;
  display_order: number | null;
  image_type: string | null;
}

interface ProductVariant {
  id?: string;
  size_us: number;
  size_eu: number;
  size_uk: number;
  size_cm: number;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number | null;
  price_override: number | null;
  is_available: boolean | null;
}

interface ProductColor {
  id?: string;
  color_name: string;
  color_code: string | null;
  sku_suffix: string;
  is_available: boolean | null;
  display_order: number | null;
  product_color_images: ProductImage[];
  product_variants: ProductVariant[];
}

interface Product {
  id: string;
  brand_id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  gender: string;
  is_featured: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
  product_colors: ProductColor[];
}

interface ProductFormProps {
  product?: Product;
  brands: Brand[];
  categories: Category[];
}

// Standard US sizes for sneakers
const STANDARD_SIZES = [
  { us: 6, eu: 38.5, uk: 5.5, cm: 24 },
  { us: 6.5, eu: 39, uk: 6, cm: 24.5 },
  { us: 7, eu: 40, uk: 6.5, cm: 25 },
  { us: 7.5, eu: 40.5, uk: 7, cm: 25.5 },
  { us: 8, eu: 41, uk: 7.5, cm: 26 },
  { us: 8.5, eu: 42, uk: 8, cm: 26.5 },
  { us: 9, eu: 42.5, uk: 8.5, cm: 27 },
  { us: 9.5, eu: 43, uk: 9, cm: 27.5 },
  { us: 10, eu: 44, uk: 9.5, cm: 28 },
  { us: 10.5, eu: 44.5, uk: 10, cm: 28.5 },
  { us: 11, eu: 45, uk: 10.5, cm: 29 },
  { us: 11.5, eu: 45.5, uk: 11, cm: 29.5 },
  { us: 12, eu: 46, uk: 11.5, cm: 30 },
  { us: 13, eu: 47.5, uk: 12.5, cm: 31 },
];

export function ProductForm({ product, brands, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    brand_id: product?.brand_id || '',
    category_id: product?.category_id || '',
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    description: product?.description || '',
    base_price: product?.base_price || 0,
    compare_at_price: product?.compare_at_price || '',
    status: product?.status || 'draft',
    gender: product?.gender || 'unisex',
    is_featured: product?.is_featured || false,
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
  });

  const [colors, setColors] = useState<ProductColor[]>(
    product?.product_colors || []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'colors' | 'seo'>('info');

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
      sku: isEditing ? prev.sku : generateBaseSKU(name),
    }));
  };

  const addColor = () => {
    const newColor: ProductColor = {
      color_name: '',
      color_code: '#000000',
      sku_suffix: '',
      is_available: true,
      display_order: colors.length,
      product_color_images: [],
      product_variants: [],
    };
    setColors([...colors, newColor]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, updates: Partial<ProductColor>) => {
    setColors(
      colors.map((color, i) => (i === index ? { ...color, ...updates } : color))
    );
  };

  const addImageToColor = (colorIndex: number) => {
    const newImage: ProductImage = {
      image_url: '',
      alt_text: '',
      display_order: colors[colorIndex].product_color_images.length,
      image_type: 'front',
    };
    updateColor(colorIndex, {
      product_color_images: [...colors[colorIndex].product_color_images, newImage],
    });
  };

  const removeImageFromColor = (colorIndex: number, imageIndex: number) => {
    updateColor(colorIndex, {
      product_color_images: colors[colorIndex].product_color_images.filter(
        (_, i) => i !== imageIndex
      ),
    });
  };

  const updateImage = (
    colorIndex: number,
    imageIndex: number,
    updates: Partial<ProductImage>
  ) => {
    updateColor(colorIndex, {
      product_color_images: colors[colorIndex].product_color_images.map((img, i) =>
        i === imageIndex ? { ...img, ...updates } : img
      ),
    });
  };

  const generateVariantsForColor = (colorIndex: number) => {
    const color = colors[colorIndex];
    const variants: ProductVariant[] = STANDARD_SIZES.map((size) => ({
      size_us: size.us,
      size_eu: size.eu,
      size_uk: size.uk,
      size_cm: size.cm,
      sku: `${formData.sku}-${color.sku_suffix}-${size.us}`.toUpperCase(),
      stock_quantity: 0,
      low_stock_threshold: 5,
      price_override: null,
      is_available: true,
    }));
    updateColor(colorIndex, { product_variants: variants });
  };

  const updateVariant = (
    colorIndex: number,
    variantIndex: number,
    updates: Partial<ProductVariant>
  ) => {
    updateColor(colorIndex, {
      product_variants: colors[colorIndex].product_variants.map((v, i) =>
        i === variantIndex ? { ...v, ...updates } : v
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const productData = {
        brand_id: formData.brand_id,
        category_id: formData.category_id,
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku,
        description: formData.description || null,
        base_price: formData.base_price,
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        status: formData.status,
        gender: formData.gender,
        is_featured: formData.is_featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      };

      let productId: string;

      if (isEditing && product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        productId = product.id;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Handle colors, images, and variants
      for (const [colorIndex, color] of colors.entries()) {
        let colorId: string;
        const originalColor = color.id
          ? product?.product_colors.find((item) => item.id === color.id)
          : product?.product_colors[colorIndex];

        const colorData = {
          product_id: productId,
          color_name: color.color_name,
          color_code: color.color_code,
          sku_suffix: color.sku_suffix,
          is_available: color.is_available ?? true,
          display_order: color.display_order ?? 0,
        };

        if (color.id) {
          // Update existing color
          const { error } = await supabase
            .from('product_colors')
            .update(colorData)
            .eq('id', color.id);

          if (error) throw error;
          colorId = color.id;
        } else {
          // Create new color
          const { data, error } = await supabase
            .from('product_colors')
            .insert(colorData)
            .select('id')
            .single();

          if (error) throw error;
          colorId = data.id;
        }

        if (hasImageChanges(color.product_color_images, originalColor?.product_color_images || [])) {
          const validImages = color.product_color_images
            .filter((image) => image.image_url.trim())
            .map((image) => ({
              id: image.id,
              product_color_id: colorId,
              image_url: image.image_url.trim(),
              alt_text: image.alt_text || null,
              display_order: image.display_order ?? 0,
              image_type: image.image_type || 'front',
            }));

          const existingImages = validImages.filter((image) => image.id);

          const newImages = validImages
            .filter((image) => !image.id)
            .map((image) => {
              const imageData = { ...image };
              delete imageData.id;
              return imageData;
            });

          const imageResults = await Promise.all([
            existingImages.length
              ? supabase.from('product_color_images').upsert(existingImages, {
                  onConflict: 'id',
                })
              : Promise.resolve({ error: null }),
            newImages.length
              ? supabase.from('product_color_images').insert(newImages)
              : Promise.resolve({ error: null }),
          ]);

          const imageError = imageResults.find((result) => result.error)?.error;
          if (imageError) throw imageError;
        }

        if (hasVariantChanges(color.product_variants, originalColor?.product_variants || [])) {
          const variantRows = color.product_variants.map((variant) => ({
            id: variant.id,
            product_id: productId,
            product_color_id: colorId,
            size_us: variant.size_us,
            size_eu: variant.size_eu,
            size_uk: variant.size_uk,
            size_cm: variant.size_cm,
            sku: variant.sku,
            stock_quantity: variant.stock_quantity,
            low_stock_threshold: variant.low_stock_threshold ?? 5,
            price_override: variant.price_override || null,
            is_available: variant.is_available ?? true,
          }));

          const existingVariants = variantRows.filter((variant) => variant.id);

          const newVariants = variantRows
            .filter((variant) => !variant.id)
            .map((variant) => {
              const variantData = { ...variant };
              delete variantData.id;
              return variantData;
            });

          const variantResults = await Promise.all([
            existingVariants.length
              ? supabase.from('product_variants').upsert(existingVariants, {
                  onConflict: 'id',
                })
              : Promise.resolve({ error: null }),
            newVariants.length
              ? supabase.from('product_variants').insert(newVariants)
              : Promise.resolve({ error: null }),
          ]);

          const variantError = variantResults.find((result) => result.error)?.error;
          if (variantError) throw variantError;
        }
      }

      router.push('/admin/productos');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al guardar el producto');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'info'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-gray-600 hover:text-brand-black'
          }`}
        >
          Información
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'colors'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-gray-600 hover:text-brand-black'
          }`}
        >
          Colores y Variantes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'seo'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-gray-600 hover:text-brand-black'
          }`}
        >
          SEO
        </button>
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-brand-black">Información Básica</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nike Air Max 90"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="nike-air-max-90"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="NAM90"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descripción</Label>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción del producto... o usa IA para generarla automáticamente"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  La IA generará una descripción profesional basada en el nombre, marca y colores del producto.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-brand-black">Precios</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Precio Base (Q) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_at_price">Precio Comparar (Q)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.compare_at_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compare_at_price: e.target.value,
                      })
                    }
                    placeholder="Precio original para mostrar descuento"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-brand-black">Organización</h3>

              <div className="space-y-2">
                <Label htmlFor="brand_id">Marca *</Label>
                <select
                  id="brand_id"
                  value={formData.brand_id}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                >
                  <option value="">Seleccionar marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Categoría *</Label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Género *</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                >
                  <option value="unisex">Unisex</option>
                  <option value="men">Hombre</option>
                  <option value="women">Mujer</option>
                  <option value="kids">Niños</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured">Destacado</Label>
                  <p className="text-sm text-gray-600">Mostrar en home</p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {colors.map((color, colorIndex) => (
            <div
              key={colorIndex}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand-black">
                  Color {colorIndex + 1}: {color.color_name || 'Sin nombre'}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeColor(colorIndex)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Color Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Color *</Label>
                  <Input
                    value={color.color_name}
                    onChange={(e) =>
                      updateColor(colorIndex, { color_name: e.target.value })
                    }
                    placeholder="Negro/Blanco"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código de Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color.color_code || '#000000'}
                      onChange={(e) =>
                        updateColor(colorIndex, { color_code: e.target.value })
                      }
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={color.color_code || ''}
                      onChange={(e) =>
                        updateColor(colorIndex, { color_code: e.target.value })
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sufijo SKU *</Label>
                  <Input
                    value={color.sku_suffix}
                    onChange={(e) =>
                      updateColor(colorIndex, {
                        sku_suffix: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="BLK"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={color.is_available ?? true}
                      onCheckedChange={(checked) =>
                        updateColor(colorIndex, { is_available: checked })
                      }
                    />
                    <Label>Disponible</Label>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Imágenes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addImageToColor(colorIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Imagen
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {color.product_color_images.map((image, imageIndex) => (
                    <div
                      key={imageIndex}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      {image.image_url ? (
                        <img
                          src={image.image_url}
                          alt={image.alt_text || 'Product'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <Input
                        value={image.image_url}
                        onChange={(e) =>
                          updateImage(colorIndex, imageIndex, {
                            image_url: e.target.value,
                          })
                        }
                        placeholder="URL de imagen"
                      />
                      <div className="flex gap-2">
                        <select
                          value={image.image_type || 'front'}
                          onChange={(e) =>
                            updateImage(colorIndex, imageIndex, {
                              image_type: e.target.value,
                            })
                          }
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                        >
                          <option value="front">Frontal</option>
                          <option value="side">Lateral</option>
                          <option value="back">Trasera</option>
                          <option value="sole">Suela</option>
                          <option value="detail">Detalle</option>
                          <option value="lifestyle">Lifestyle</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImageFromColor(colorIndex, imageIndex)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Variantes (Tallas)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateVariantsForColor(colorIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Generar Tallas Estándar
                  </Button>
                </div>

                {color.product_variants.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">US</th>
                          <th className="px-3 py-2 text-left">EU</th>
                          <th className="px-3 py-2 text-left">SKU</th>
                          <th className="px-3 py-2 text-left">Stock</th>
                          <th className="px-3 py-2 text-left">Disponible</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {color.product_variants.map((variant, variantIndex) => (
                          <tr key={variantIndex}>
                            <td className="px-3 py-2">{variant.size_us}</td>
                            <td className="px-3 py-2">{variant.size_eu}</td>
                            <td className="px-3 py-2">
                              <code className="text-xs bg-gray-100 px-1 rounded">
                                {variant.sku}
                              </code>
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                value={variant.stock_quantity}
                                onChange={(e) =>
                                  updateVariant(colorIndex, variantIndex, {
                                    stock_quantity: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-20 h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Switch
                                checked={variant.is_available ?? true}
                                onCheckedChange={(checked) =>
                                  updateVariant(colorIndex, variantIndex, {
                                    is_available: checked,
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addColor}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Color
          </Button>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-2xl">
          <h3 className="font-semibold text-brand-black">
            Optimización para Motores de Búsqueda
          </h3>

          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta Título</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) =>
                setFormData({ ...formData, meta_title: e.target.value })
              }
              placeholder={formData.name || 'Título para Google'}
            />
            <p className="text-xs text-gray-500">
              {formData.meta_title?.length || 0}/60 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Descripción</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) =>
                setFormData({ ...formData, meta_description: e.target.value })
              }
              placeholder="Descripción para resultados de búsqueda..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {formData.meta_description?.length || 0}/160 caracteres
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Vista previa en Google:</p>
            <div className="space-y-1">
              <p className="text-blue-600 text-lg">
                {formData.meta_title || formData.name || 'Título del producto'}
              </p>
              <p className="text-green-700 text-sm">
                calleochostore.com/productos/{formData.slug || 'slug'}
              </p>
              <p className="text-gray-600 text-sm">
                {formData.meta_description ||
                  formData.description?.slice(0, 160) ||
                  'Descripción del producto...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between sticky bottom-0 bg-gray-50 py-4 -mx-4 px-4 lg:-mx-8 lg:px-8 border-t border-gray-200">
        <Link href="/admin/productos">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            variant="outline"
            onClick={() => setFormData({ ...formData, status: 'draft' })}
          >
            Guardar Borrador
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-brand-blue hover:bg-brand-blue/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : isEditing ? (
              'Guardar Cambios'
            ) : (
              'Crear Producto'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function hasVariantChanges(current: ProductVariant[], original: ProductVariant[]) {
  if (current.length !== original.length) return true;

  const originalById = new Map(
    original.filter((variant) => variant.id).map((variant) => [variant.id, variant])
  );

  return current.some((variant, index) => {
    if (!variant.id) return true;

    const originalVariant = originalById.get(variant.id) || original[index];
    if (!originalVariant) return true;

    return (
      Number(variant.size_us) !== Number(originalVariant.size_us) ||
      Number(variant.size_eu) !== Number(originalVariant.size_eu) ||
      Number(variant.size_uk) !== Number(originalVariant.size_uk) ||
      Number(variant.size_cm) !== Number(originalVariant.size_cm) ||
      variant.sku !== originalVariant.sku ||
      Number(variant.stock_quantity) !== Number(originalVariant.stock_quantity) ||
      Number(variant.low_stock_threshold ?? 5) !== Number(originalVariant.low_stock_threshold ?? 5) ||
      Number(variant.price_override ?? 0) !== Number(originalVariant.price_override ?? 0) ||
      Boolean(variant.is_available ?? true) !== Boolean(originalVariant.is_available ?? true)
    );
  });
}

function hasImageChanges(current: ProductImage[], original: ProductImage[]) {
  const currentValid = current.filter((image) => image.image_url.trim());
  const originalValid = original.filter((image) => image.image_url.trim());

  if (currentValid.length !== originalValid.length) return true;

  const originalById = new Map(
    originalValid.filter((image) => image.id).map((image) => [image.id, image])
  );

  return currentValid.some((image, index) => {
    if (!image.id) return true;

    const originalImage = originalById.get(image.id) || originalValid[index];
    if (!originalImage) return true;

    return (
      image.image_url.trim() !== originalImage.image_url.trim() ||
      (image.alt_text || '') !== (originalImage.alt_text || '') ||
      Number(image.display_order ?? 0) !== Number(originalImage.display_order ?? 0) ||
      (image.image_type || 'front') !== (originalImage.image_type || 'front')
    );
  });
}
