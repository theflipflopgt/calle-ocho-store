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
import { calculateFinalPrice } from '@/lib/pricing/calculate-final-price';
import {
  hasValidProductImageCount,
  MAX_PRODUCT_IMAGES_PER_COLOR,
} from '@/lib/products/product-images';
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, ImageIcon, Sparkles } from 'lucide-react';
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
  cost_price?: number | null;
  invoice_fee_percent?: number | null;
  neo_link_fee_percent?: number | null;
  desired_profit_amount?: number | null;
  sale_price_markup_percent?: number | null;
  calculated_sale_price?: number | null;
  status: string;
  gender: string;
  is_featured: boolean | null;
  is_new_release: boolean | null;
  new_release_until: string | null;
  meta_title: string | null;
  meta_description: string | null;
  product_colors: ProductColor[];
}

interface ProductFormProps {
  product?: Product;
  brands: Brand[];
  categories: Category[];
}

interface RemovedVariant {
  colorId?: string;
  variant: ProductVariant;
}

type ShoeSize = {
  us: number;
  eu: number;
  uk: number;
  cm: number;
};

function createEmptyProductImage(displayOrder = 0): ProductImage {
  return {
    image_url: '',
    alt_text: '',
    display_order: displayOrder,
    image_type: displayOrder === 0 ? 'front' : 'detail',
  };
}


function createSingleProductColor(): ProductColor {
  return {
    color_name: '',
    color_code: '#000000',
    // La base de datos conserva product_colors por compatibilidad con catálogo,
    // inventario y pedidos. Para productos nuevos usamos una sola presentación
    // interna por SKU, por eso el sufijo ya no se pide al usuario.
    sku_suffix: 'BASE',
    is_available: true,
    display_order: 0,
    product_color_images: [createEmptyProductImage()],
    product_variants: [],
  };
}

const WOMEN_SIZES: ShoeSize[] = [
  { us: 5, eu: 34.5, uk: 2.5, cm: 22 },
  { us: 5.5, eu: 35, uk: 3, cm: 22.5 },
  { us: 6, eu: 36, uk: 3.5, cm: 23 },
  { us: 6.5, eu: 36.5, uk: 4, cm: 23.5 },
  { us: 7, eu: 37, uk: 4.5, cm: 24 },
  { us: 7.5, eu: 38, uk: 5, cm: 24.5 },
  { us: 8, eu: 38.5, uk: 5.5, cm: 25 },
  { us: 8.5, eu: 39, uk: 6, cm: 25.5 },
  { us: 9, eu: 39.5, uk: 6.5, cm: 26 },
  { us: 9.5, eu: 40.5, uk: 7, cm: 26.5 },
  { us: 10, eu: 41, uk: 7.5, cm: 27 },
];

const MEN_SIZES: ShoeSize[] = [
  { us: 7, eu: 40, uk: 6.5, cm: 25 },
  { us: 7.5, eu: 40.5, uk: 7, cm: 25.5 },
  { us: 8, eu: 41, uk: 7.5, cm: 26 },
  { us: 8.5, eu: 41.5, uk: 8, cm: 26.5 },
  { us: 9, eu: 42, uk: 8.5, cm: 27 },
  { us: 9.5, eu: 42.5, uk: 9, cm: 27.5 },
  { us: 10, eu: 43, uk: 9.5, cm: 28 },
  { us: 10.5, eu: 44, uk: 10, cm: 28.5 },
  { us: 11, eu: 44.5, uk: 10.5, cm: 29 },
  { us: 11.5, eu: 45, uk: 11, cm: 29.5 },
  { us: 12, eu: 46, uk: 11.5, cm: 30 },
  { us: 13, eu: 46.5, uk: 12.5, cm: 31 },
];

const KIDS_SIZES: ShoeSize[] = [
  { us: 8.5, eu: 26, uk: 8, cm: 14.5 },
  { us: 9, eu: 26.5, uk: 8.5, cm: 15 },
  { us: 9.5, eu: 27, uk: 9, cm: 15.5 },
  { us: 10, eu: 27.5, uk: 9.5, cm: 16 },
  { us: 10.5, eu: 28, uk: 10, cm: 16.5 },
  { us: 11, eu: 28.5, uk: 10.5, cm: 17 },
  { us: 11.5, eu: 29, uk: 11, cm: 16.5 },
  { us: 12, eu: 29.7, uk: 11.5, cm: 17 },
  { us: 12.5, eu: 30.5, uk: 12, cm: 17.5 },
  { us: 13, eu: 31, uk: 12.5, cm: 18 },
  { us: 13.5, eu: 31.5, uk: 13, cm: 18.5 },
  { us: 1, eu: 33, uk: 13.5, cm: 19 },
  { us: 1.5, eu: 33.5, uk: 1, cm: 19.5 },
  { us: 2, eu: 34, uk: 1.5, cm: 20 },
  { us: 2.5, eu: 34.7, uk: 2, cm: 20.5 },
  { us: 3, eu: 35, uk: 2.5, cm: 21 },
  { us: 3.5, eu: 35.5, uk: 3, cm: 21.5 },
  { us: 4, eu: 36, uk: 3.5, cm: 22 },
  { us: 4.5, eu: 37, uk: 4, cm: 22.5 },
  { us: 5, eu: 37.5, uk: 4.5, cm: 23 },
];

const UNISEX_SIZES: ShoeSize[] = [
  { us: 5, eu: 35, uk: 3, cm: 22.5 },
  { us: 5.5, eu: 35, uk: 3, cm: 22.5 },
  { us: 6, eu: 36, uk: 3.5, cm: 23 },
  { us: 6.5, eu: 36.5, uk: 4, cm: 23.5 },
  { us: 7, eu: 40, uk: 6.5, cm: 25 },
  { us: 7.5, eu: 40.5, uk: 7, cm: 25.5 },
  { us: 8, eu: 41, uk: 7.5, cm: 26 },
  { us: 8.5, eu: 41.5, uk: 8, cm: 26.5 },
  { us: 9, eu: 42, uk: 8.5, cm: 27 },
  { us: 9.5, eu: 42.5, uk: 9, cm: 27.5 },
  { us: 10, eu: 43, uk: 9.5, cm: 28 },
  { us: 10.5, eu: 44, uk: 10, cm: 28.5 },
  { us: 11, eu: 44.5, uk: 10.5, cm: 29 },
  { us: 11.5, eu: 45, uk: 11, cm: 29.5 },
  { us: 12, eu: 46, uk: 11.5, cm: 30 },
  { us: 13, eu: 46.5, uk: 12.5, cm: 31 },
];

const getSizesForGender = (gender: string) => {
  if (gender === 'hombre') return MEN_SIZES;
  if (gender === 'mujer') return WOMEN_SIZES;
  if (gender === 'ninos') return KIDS_SIZES;
  return UNISEX_SIZES;
};

const getSizeGuideLabel = (gender: string) => {
  if (gender === 'hombre') return 'Caballero';
  if (gender === 'mujer') return 'Dama';
  if (gender === 'ninos') return 'Niños';
  return 'Unisex adulto';
};

const toDatabaseGender = (gender: string) => {
  if (gender === 'hombre') return 'men';
  if (gender === 'mujer') return 'women';
  if (gender === 'ninos') return 'kids';
  return 'unisex';
};

const getProductSaveErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message || '')
        : String(error || '');
  if (message.includes('PRODUCT_COLOR_REQUIRES_1_TO_5_IMAGES')) {
    return 'Cada color debe tener entre 1 y 5 imágenes.';
  }
  if (message.includes('COMMERCIAL_FEES_MUST_BE_BELOW_100')) {
    return 'La suma del costo de facturación y Neo Link debe ser menor al 100 %.';
  }
  if (message.includes('INVALID_COMMERCIAL_AMOUNT')) {
    return 'Los montos comerciales no pueden ser negativos.';
  }
  return message || 'Error al guardar el producto';
};

export function ProductForm({ product, brands, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const normalizeGender = (gender?: string) => {
    if (gender === 'men') return 'hombre';
    if (gender === 'women') return 'mujer';
    if (gender === 'kids') return 'ninos';
    return gender || 'unisex';
  };

  const [formData, setFormData] = useState({
    brand_id: product?.brand_id || '',
    category_id: product?.category_id || '',
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    description: product?.description || '',
    base_price: product?.base_price || 0,
    compare_at_price: product?.compare_at_price || '',
    cost_price: product?.cost_price || 0,
    invoice_fee_percent: product?.invoice_fee_percent || 0,
    neo_link_fee_percent: product?.neo_link_fee_percent || 0,
    desired_profit_amount:
      product?.desired_profit_amount ?? product?.sale_price_markup_percent ?? 0,
    calculated_sale_price: product?.calculated_sale_price || 0,
    status: product?.status || 'draft',
    gender: normalizeGender(product?.gender),
    is_featured: product?.is_featured || false,
    is_new_release: product?.is_new_release ?? !product,
    new_release_until: product?.new_release_until
      ? product.new_release_until.slice(0, 10)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toISOString().slice(0, 10);
        })(),
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
  });

  const [colors, setColors] = useState<ProductColor[]>(() => {
    const existingColors =
      product?.product_colors.map((color) => ({
        ...color,
        product_color_images: [...color.product_color_images].sort(
          (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
        ),
        product_variants: color.product_variants.filter(
          (variant) => variant.is_available !== false
        ),
      })) || [];
    const availableExistingColors = existingColors.filter(
      (color) => color.is_available !== false
    );

    // No cambiamos el esquema de inventario: product_colors sigue siendo la capa
    // que relaciona imágenes y tallas. Solo simplificamos el alta nueva a 1 SKU = 1 color.
    // Las presentaciones retiradas permanecen en la base de datos para proteger el
    // historial de pedidos, pero ya no vuelven a mostrarse en el editor.
    if (availableExistingColors.length > 0) return availableExistingColors;
    if (existingColors.length > 0) return existingColors;
    return [createSingleProductColor()];
  });
  const [removedVariants, setRemovedVariants] = useState<RemovedVariant[]>(
    () =>
      product?.product_colors.flatMap((color) =>
        color.product_variants
          .filter((variant) => variant.is_available === false)
          .map((variant) => ({
            colorId: color.id,
            variant,
          }))
      ) || []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'colors' | 'seo'>('info');
  const availableSizes = getSizesForGender(formData.gender);
  const sizeGuideLabel = getSizeGuideLabel(formData.gender);
  const calculatedSuggestedSalePrice = calculateFinalPrice(
    Number(formData.cost_price || 0),
    Number(formData.desired_profit_amount || 0),
    Number(formData.neo_link_fee_percent || 0),
    Number(formData.invoice_fee_percent || 0)
  );
  const suggestedSalePrice = calculatedSuggestedSalePrice ?? 0;
  const hasInvalidFeeTotal =
    Number(formData.neo_link_fee_percent || 0) +
      Number(formData.invoice_fee_percent || 0) >=
    100;

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
      sku: isEditing ? prev.sku : generateBaseSKU(name),
    }));
  };

  const updateColor = (index: number, updates: Partial<ProductColor>) => {
    setColors(
      colors.map((color, i) => (i === index ? { ...color, ...updates } : color))
    );
  };

  const removeColor = (colorIndex: number) => {
    if (colors.length <= 1) {
      setError('El producto debe conservar al menos una presentación.');
      return;
    }

    const color = colors[colorIndex];
    const stockToRemove = color.product_variants.reduce(
      (total, variant) => total + Number(variant.stock_quantity || 0),
      0
    );
    const confirmationMessage = stockToRemove > 0
      ? `Esta presentación tiene ${stockToRemove} pares en existencia. Al guardar quedará no disponible y su existencia pasará a 0. Los pedidos anteriores no se modificarán. ¿Deseas continuar?`
      : 'Esta presentación quedará no disponible al guardar. Los pedidos anteriores no se modificarán. ¿Deseas continuar?';

    if (!window.confirm(confirmationMessage)) return;

    setRemovedVariants((current) => {
      const removedIds = new Set(current.map((item) => item.variant.id).filter(Boolean));
      const variantsToRemove = color.product_variants
        .filter((variant) => variant.id && !removedIds.has(variant.id))
        .map((variant) => ({ colorId: color.id, variant }));

      return [...current, ...variantsToRemove];
    });
    setColors((current) => current.filter((_, index) => index !== colorIndex));
    setError(null);
  };

  const addImageToColor = (colorIndex: number) => {
    const imageCount = colors[colorIndex].product_color_images.length;
    if (imageCount >= MAX_PRODUCT_IMAGES_PER_COLOR) return;

    const newImage = createEmptyProductImage(imageCount);
    updateColor(colorIndex, {
      product_color_images: [...colors[colorIndex].product_color_images, newImage],
    });
  };

  const removeImageFromColor = (colorIndex: number, imageIndex: number) => {
    if (colors[colorIndex].product_color_images.length <= 1) return;

    updateColor(colorIndex, {
      product_color_images: colors[colorIndex].product_color_images
        .filter((_, i) => i !== imageIndex)
        .map((image, index) => ({ ...image, display_order: index })),
    });
  };

  const moveImage = (colorIndex: number, imageIndex: number, direction: -1 | 1) => {
    const nextIndex = imageIndex + direction;
    const images = [...colors[colorIndex].product_color_images];
    if (nextIndex < 0 || nextIndex >= images.length) return;

    [images[imageIndex], images[nextIndex]] = [images[nextIndex], images[imageIndex]];
    updateColor(colorIndex, {
      product_color_images: images.map((image, index) => ({
        ...image,
        display_order: index,
      })),
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

  const addVariantForSize = (colorIndex: number, size: ShoeSize) => {
    const color = colors[colorIndex];
    const alreadyExists = color.product_variants.some((variant) => variant.size_us === size.us);

    if (alreadyExists) return;

    const removedVariant = removedVariants.find(
      (item) => item.colorId === color.id && item.variant.size_us === size.us
    );

    if (removedVariant) {
      updateColor(colorIndex, {
        product_variants: [
          ...color.product_variants,
          {
            ...removedVariant.variant,
            size_eu: size.eu,
            size_uk: size.uk,
            size_cm: size.cm,
            is_available: true,
          },
        ].sort((a, b) => a.size_us - b.size_us),
      });
      setRemovedVariants((current) =>
        current.filter((item) => item.variant.id !== removedVariant.variant.id)
      );
      return;
    }

    const skuSuffix = color.sku_suffix || color.color_name.slice(0, 3) || 'CLR';
    const newVariant: ProductVariant = {
      size_us: size.us,
      size_eu: size.eu,
      size_uk: size.uk,
      size_cm: size.cm,
      sku: `${formData.sku}-${skuSuffix}-${size.us}`.toUpperCase(),
      stock_quantity: 0,
      low_stock_threshold: 5,
      price_override: null,
      is_available: true,
    };

    updateColor(colorIndex, {
      product_variants: [...color.product_variants, newVariant].sort(
        (a, b) => a.size_us - b.size_us
      ),
    });
  };

  const removeVariant = (colorIndex: number, variantIndex: number) => {
    const variant = colors[colorIndex].product_variants[variantIndex];

    if (variant.id) {
      setRemovedVariants((current) => {
        if (current.some((item) => item.variant.id === variant.id)) return current;

        return [
          ...current,
          {
            colorId: colors[colorIndex].id,
            variant,
          },
        ];
      });
    }

    updateColor(colorIndex, {
      product_variants: colors[colorIndex].product_variants.filter(
        (_, index) => index !== variantIndex
      ),
    });
  };

  const toggleSizeForColor = (colorIndex: number, size: ShoeSize) => {
    const variantIndex = colors[colorIndex].product_variants.findIndex(
      (variant) => variant.size_us === size.us
    );

    if (variantIndex >= 0) {
      removeVariant(colorIndex, variantIndex);
      return;
    }

    addVariantForSize(colorIndex, size);
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

  const selectedBrandName = brands.find((brand) => brand.id === formData.brand_id)?.name || '';
  const selectedCategoryName = categories.find((category) => category.id === formData.category_id)?.name || '';
  const primaryColorName = colors[0]?.color_name || '';
  const hasLegacyMultipleColors = colors.length > 1;

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      setError('Escribe primero el nombre del producto para generar la descripción.');
      return;
    }

    setIsGeneratingDescription(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/products/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          brand: selectedBrandName,
          category: selectedCategoryName,
          color: primaryColorName,
          gender: formData.gender,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.description) {
        throw new Error(data?.error || 'No se pudo generar la descripción.');
      }

      setFormData((current) => ({ ...current, description: data.description }));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'No se pudo generar la descripción.'
      );
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasInvalidFeeTotal) {
      setError('La suma de factura y Neo Link debe ser menor al 100 %.');
      return;
    }

    if (colors.length === 0) {
      setError('El producto debe tener una presentación para asociar sus tallas e imágenes.');
      return;
    }

    const invalidImageColor = colors.find((color) => {
      const images = color.product_color_images;
      return !hasValidProductImageCount(images);
    });

    if (invalidImageColor) {
      setError(
        `El color ${invalidImageColor.color_name || 'sin nombre'} debe tener entre 1 y 5 imágenes con URL.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const compareAtPrice =
        formData.compare_at_price && Number(formData.compare_at_price) > Number(formData.base_price)
          ? Number(formData.compare_at_price)
          : null;

      const normalizedColors = colors.map((color) => ({
        ...color,
        product_color_images: color.product_color_images.map((image, index) => ({
          ...image,
          image_url: image.image_url.trim(),
          alt_text:
            image.alt_text?.trim() ||
            `${formData.name} - ${color.color_name} - ${image.image_type || `imagen ${index + 1}`}`,
          display_order: index,
        })),
      }));

      const productData = {
        brand_id: formData.brand_id,
        category_id: formData.category_id,
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku,
        description: formData.description || null,
        base_price: formData.base_price,
        compare_at_price: compareAtPrice,
        cost_price: Number(formData.cost_price || 0),
        invoice_fee_percent: Number(formData.invoice_fee_percent || 0),
        neo_link_fee_percent: Number(formData.neo_link_fee_percent || 0),
        desired_profit_amount: Number(formData.desired_profit_amount || 0),
        // Compatibilidad temporal con la funcion SQL anterior a la migracion.
        sale_price_markup_percent: Number(formData.desired_profit_amount || 0),
        calculated_sale_price: suggestedSalePrice,
        status: formData.status,
        gender: toDatabaseGender(formData.gender),
        is_featured: formData.is_featured,
        is_new_release: formData.is_new_release,
        new_release_until:
          formData.is_new_release && formData.new_release_until
            ? new Date(`${formData.new_release_until}T23:59:59`).toISOString()
            : null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      };

      const { error: saveError } = await (supabase as any).rpc('admin_save_product', {
        p_product_id: isEditing && product ? product.id : null,
        p_product: productData,
        p_colors: normalizedColors,
        p_removed_variant_ids: removedVariants
          .map((item) => item.variant.id)
          .filter(Boolean),
      });

      if (saveError) throw saveError;

      router.push('/admin/productos');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(getProductSaveErrorMessage(err));
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
          Imágenes y Tallas
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
                    onChange={(e) => {
                      const nextSku = e.target.value.toUpperCase();
                      setFormData({ ...formData, sku: nextSku });
                      setColors((current) =>
                        current.map((color) => ({
                          ...color,
                          product_variants: color.product_variants.map((variant) =>
                            variant.id
                              ? variant
                              : {
                                  ...variant,
                                  sku: `${nextSku}-${color.sku_suffix || 'BASE'}-${variant.size_us}`.toUpperCase(),
                                }
                          ),
                        }))
                      );
                    }}
                    placeholder="NAM90"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || !formData.name.trim()}
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generar descripción
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción del producto..."
                  rows={6}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Genera un borrador usando nombre, marca, categoría, color y género. Siempre puedes editarlo antes de guardar.
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

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-brand-black">Cálculo comercial</h4>
                    <p className="text-xs text-gray-600">
                      Calcula el precio que conserva tu ganancia después de factura y Neo Link.
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-brand-black">
                    Sugerido: Q {suggestedSalePrice.toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Costo (Q)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) =>
                        setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_fee_percent">Costo factura/FEL (%)</Label>
                    <Input
                      id="invoice_fee_percent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.invoice_fee_percent}
                      onChange={(e) =>
                        setFormData({ ...formData, invoice_fee_percent: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neo_link_fee_percent">Comisión Neo Link (%)</Label>
                    <Input
                      id="neo_link_fee_percent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.neo_link_fee_percent}
                      onChange={(e) =>
                        setFormData({ ...formData, neo_link_fee_percent: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desired_profit_amount">Ganancia deseada (Q)</Label>
                    <Input
                      id="desired_profit_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.desired_profit_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, desired_profit_amount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calculated_sale_price">Precio sugerido (Q)</Label>
                    <Input
                      id="calculated_sale_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={suggestedSalePrice}
                      readOnly
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Estos porcentajes son costos comerciales. El impuesto de FEL se registra por separado.
                </p>

                {hasInvalidFeeTotal && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    La suma de factura y Neo Link debe ser menor al 100 %.
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={hasInvalidFeeTotal}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      base_price: suggestedSalePrice,
                      calculated_sale_price: suggestedSalePrice,
                    })
                  }
                >
                  Usar sugerido como precio base
                </Button>
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
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                  <option value="ninos">Niños</option>
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
                  <option value="archived">Archivado</option>
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

              <div className="border-t border-gray-200 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_new_release">Nuevo lanzamiento</Label>
                    <p className="text-sm text-gray-600">
                      Mostrar en la sección de nuevos lanzamientos
                    </p>
                  </div>
                  <Switch
                    id="is_new_release"
                    checked={formData.is_new_release}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_new_release: checked })
                    }
                  />
                </div>

                {formData.is_new_release && (
                  <div className="space-y-2">
                    <Label htmlFor="new_release_until">Mostrar como nuevo hasta</Label>
                    <Input
                      id="new_release_until"
                      type="date"
                      value={formData.new_release_until}
                      onChange={(e) =>
                        setFormData({ ...formData, new_release_until: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Al terminar esta fecha, el producto saldrá automáticamente de “Nuevos lanzamientos”.
                    </p>
                  </div>
                )}
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
              key={color.id || `new-color-${colorIndex}`}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-brand-black">
                    {hasLegacyMultipleColors
                      ? `Presentación heredada ${colorIndex + 1}: ${color.color_name || 'Sin nombre'}`
                      : 'Presentación del producto'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {hasLegacyMultipleColors
                      ? 'Puedes conservarla, marcarla como no disponible o retirarla. Los pedidos anteriores mantienen sus datos.'
                      : 'Un SKU corresponde a un solo modelo/color. Las tallas de abajo comparten este color, precio e imágenes.'}
                  </p>
                </div>
                {colors.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeColor(colorIndex)}
                    className="shrink-0 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar presentación
                  </Button>
                )}
              </div>

              {/* Product presentation info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Color *</Label>
                  <Input
                    value={color.color_name}
                    onChange={(e) =>
                      updateColor(colorIndex, {
                        color_name: e.target.value,
                        sku_suffix: color.id ? color.sku_suffix : 'BASE',
                      })
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
                  <div>
                    <Label>Imágenes</Label>
                    <p className="text-xs text-gray-500">
                      {color.product_color_images.length}/{MAX_PRODUCT_IMAGES_PER_COLOR} para este producto
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={color.product_color_images.length >= MAX_PRODUCT_IMAGES_PER_COLOR}
                    onClick={() => addImageToColor(colorIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar imagen
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {color.product_color_images.map((image, imageIndex) => (
                    <div
                      key={image.id || `new-image-${imageIndex}`}
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
                          size="icon"
                          disabled={imageIndex === 0}
                          onClick={() => moveImage(colorIndex, imageIndex, -1)}
                          aria-label="Mover imagen a la izquierda"
                          title="Mover a la izquierda"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={imageIndex === color.product_color_images.length - 1}
                          onClick={() => moveImage(colorIndex, imageIndex, 1)}
                          aria-label="Mover imagen a la derecha"
                          title="Mover a la derecha"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={color.product_color_images.length <= 1}
                          onClick={() => removeImageFromColor(colorIndex, imageIndex)}
                          className="text-red-600"
                          aria-label="Eliminar imagen"
                          title={
                            color.product_color_images.length <= 1
                              ? 'Cada color necesita al menos una imagen'
                              : 'Eliminar imagen'
                          }
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
                  <div>
                    <Label>Variantes (Tallas)</Label>
                    <p className="text-xs text-gray-500">
                      Guía aplicada: {sizeGuideLabel}. Selecciona solo las tallas disponibles para este SKU.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    Ninguna talla se selecciona automáticamente.
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {availableSizes.map((size) => {
                    const selected = color.product_variants.some(
                      (variant) => variant.size_us === size.us
                    );
                    const sizeKey = `${size.us}-${size.eu}-${size.cm}`;

                    return (
                      <button
                        key={sizeKey}
                        type="button"
                        onClick={() => toggleSizeForColor(colorIndex, size)}
                        className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                          selected
                            ? 'border-brand-blue bg-brand-blue text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-brand-blue'
                        }`}
                      >
                        {size.us}
                      </button>
                    );
                  })}
                </div>

                {color.product_variants.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">US</th>
                          <th className="px-3 py-2 text-left">EU</th>
                          <th className="px-3 py-2 text-left">Stock</th>
                          <th className="px-3 py-2 text-left">Disponible</th>
                          <th className="px-3 py-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {color.product_variants.map((variant, variantIndex) => (
                          <tr key={variantIndex}>
                            <td className="px-3 py-2">{variant.size_us}</td>
                            <td className="px-3 py-2">{variant.size_eu}</td>
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
                            <td className="px-3 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariant(colorIndex, variantIndex)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          {!hasLegacyMultipleColors && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Si el mismo modelo llega en otro color con otro SKU, créalo como un producto separado. Así el inventario queda alineado con el código real de mercadería.
            </div>
          )}
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
