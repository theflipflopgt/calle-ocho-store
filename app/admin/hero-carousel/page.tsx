'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, EyeOff, Trash2, Search, Package, Save, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface FeaturedProduct {
  id: string;
  product_id: string;
  display_order: number;
  is_active: boolean;
  badge_text: string | null;
  brand_text: string | null;
  title_text: string | null;
  subtitle_text: string | null;
  price_text: string | null;
  primary_button_text: string | null;
  secondary_button_text: string | null;
  show_badge: boolean;
  show_brand: boolean;
  show_title: boolean;
  show_subtitle: boolean;
  show_price: boolean;
  show_primary_button: boolean;
  show_secondary_button: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    brand: { name: string };
    colors: Array<{
      images: Array<{ image_url: string }>;
    }>;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  brand: { name: string };
  colors: Array<{
    images: Array<{ image_url: string }>;
  }>;
}

export default function HeroCarouselPage() {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const supabase = createClient();

  // Load featured products
  useEffect(() => {
    loadFeaturedProducts();
    loadAvailableProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('featured_products')
      .select(`
        id,
        product_id,
        display_order,
        is_active,
        badge_text,
        brand_text,
        title_text,
        subtitle_text,
        price_text,
        primary_button_text,
        secondary_button_text,
        show_badge,
        show_brand,
        show_title,
        show_subtitle,
        show_price,
        show_primary_button,
        show_secondary_button,
        product:products (
          id,
          name,
          slug,
          base_price,
          brand:brands (name),
          colors:product_colors (
            images:product_color_images (image_url)
          )
        )
      `)
      .order('display_order');

    if (error) {
      setMessageType('error');
      setMessage(`No se pudieron cargar los productos destacados: ${error.message}`);
    } else if (data) {
      setFeaturedProducts(data as any);
    }
    setIsLoading(false);
  };

  const loadAvailableProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        base_price,
        brand:brands (name),
        colors:product_colors (
          images:product_color_images (image_url)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setMessageType('error');
      setMessage(`No se pudieron cargar los productos disponibles: ${error.message}`);
    } else if (data) {
      setAvailableProducts(data as any);
    }
  };

  const saveFeaturedProducts = async (items = featuredProducts) => {
    setIsSaving(true);
    setMessage(null);

    for (const item of items) {
      const { error } = await supabase
        .from('featured_products')
        .update({
          display_order: item.display_order,
          is_active: item.is_active,
          badge_text: item.badge_text || null,
          brand_text: item.brand_text || null,
          title_text: item.title_text || null,
          subtitle_text: item.subtitle_text || null,
          price_text: item.price_text || null,
          primary_button_text: item.primary_button_text || null,
          secondary_button_text: item.secondary_button_text || null,
          show_badge: item.show_badge,
          show_brand: item.show_brand,
          show_title: item.show_title,
          show_subtitle: item.show_subtitle,
          show_price: item.show_price,
          show_primary_button: item.show_primary_button,
          show_secondary_button: item.show_secondary_button,
        })
        .eq('id', item.id);

      if (error) {
        setIsSaving(false);
        setMessageType('error');
        setMessage(`No se pudieron guardar los cambios: ${error.message}`);
        return false;
      }
    }

    setIsSaving(false);
    setMessageType('success');
    setMessage('Cambios del HeroCarousel guardados.');
    return true;
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(featuredProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display_order
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index,
    }));

    setFeaturedProducts(updatedItems);
    await saveFeaturedProducts(updatedItems);
  };

  const addProduct = async (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    const maxOrder = featuredProducts.length > 0
      ? Math.max(...featuredProducts.map(fp => fp.display_order))
      : -1;

    const { data, error } = await supabase
      .from('featured_products')
      .insert({
        product_id: productId,
        display_order: maxOrder + 1,
        is_active: true,
      })
      .select(`
        id,
        product_id,
        display_order,
        is_active,
        badge_text,
        brand_text,
        title_text,
        subtitle_text,
        price_text,
        primary_button_text,
        secondary_button_text,
        show_badge,
        show_brand,
        show_title,
        show_subtitle,
        show_price,
        show_primary_button,
        show_secondary_button,
        product:products (
          id,
          name,
          slug,
          base_price,
          brand:brands (name),
          colors:product_colors (
            images:product_color_images (image_url)
          )
        )
      `)
      .single();

    if (!error && data) {
      setFeaturedProducts([...featuredProducts, data as any]);
      setMessageType('success');
      setMessage('Producto agregado al HeroCarousel.');
    } else if (error) {
      setMessageType('error');
      setMessage(`No se pudo agregar el producto: ${error.message}`);
    }
  };

  const removeProduct = async (featuredProductId: string) => {
    setMessage(null);
    const { error } = await supabase
      .from('featured_products')
      .delete()
      .eq('id', featuredProductId);

    if (error) {
      setMessageType('error');
      setMessage(`No se pudo quitar el producto del carrusel: ${error.message}`);
      return;
    }

    const remainingProducts = featuredProducts
      .filter(fp => fp.id !== featuredProductId)
      .map((item, index) => ({ ...item, display_order: index }));

    setFeaturedProducts(remainingProducts);
    const saved = await saveFeaturedProducts(remainingProducts);
    if (saved) {
      setMessageType('success');
      setMessage('Producto eliminado del HeroCarousel.');
    }
  };

  const toggleActive = async (featuredProductId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('featured_products')
      .update({ is_active: !currentActive })
      .eq('id', featuredProductId);

    if (error) {
      setMessageType('error');
      setMessage(`No se pudo actualizar el producto: ${error.message}`);
      return;
    }

    setFeaturedProducts(
      featuredProducts.map(fp =>
        fp.id === featuredProductId ? { ...fp, is_active: !currentActive } : fp
      )
    );
    setMessageType('success');
    setMessage('Estado del producto actualizado.');
  };

  const updateFeaturedProduct = (
    featuredProductId: string,
    updates: Partial<FeaturedProduct>
  ) => {
    setFeaturedProducts((current) =>
      current.map((item) =>
        item.id === featuredProductId ? { ...item, ...updates } : item
      )
    );
  };

  const filteredAvailableProducts = availableProducts.filter(
    p =>
      !featuredProducts.some(fp => fp.product_id === p.id) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Hero Carousel</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los productos destacados del carrusel principal. Arrastra para reordenar.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => saveFeaturedProducts()}
          disabled={isSaving}
          className="bg-brand-blue hover:bg-brand-blue/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {message && (
        <div className={cn(
          'rounded-lg border px-4 py-3 text-sm',
          messageType === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-green-200 bg-green-50 text-green-700'
        )}>
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Featured Products (Drag & Drop) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-black">
              Productos Destacados ({featuredProducts.length})
            </h2>
            {isSaving && <span className="text-sm text-gray-500">Guardando...</span>}
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hay productos destacados.</p>
              <p className="text-sm">Agrega productos desde la lista de la derecha.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="featured-products">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "space-y-3 min-h-[200px] p-3 rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-blue-50"
                    )}
                  >
                    {featuredProducts.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "bg-gray-50 rounded-lg p-3 border-2 transition-all",
                              snapshot.isDragging
                                ? "border-brand-blue shadow-lg"
                                : "border-transparent",
                              !item.is_active && "opacity-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              {/* Product Image */}
                              <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                                {item.product.colors[0]?.images[0]?.image_url ? (
                                  <Image
                                    src={item.product.colors[0].images[0].image_url}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                    Sin img
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-brand-black truncate">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.product.brand.name} • {formatPrice(item.product.base_price)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Posición: {index + 1}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingProductId(
                                      editingProductId === item.id ? null : item.id
                                    )
                                  }
                                  title="Editar textos"
                                  aria-label={`Editar textos de ${item.product.name}`}
                                >
                                  {editingProductId === item.id ? (
                                    <X className="w-4 h-4 text-brand-blue" />
                                  ) : (
                                    <Pencil className="w-4 h-4 text-brand-blue" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleActive(item.id, item.is_active)}
                                  title={item.is_active ? 'Desactivar' : 'Activar'}
                                >
                                  {item.is_active ? (
                                    <Eye className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProduct(item.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>

                            {editingProductId === item.id && (
                              <div className="mt-4 border-t border-gray-200 pt-4">
                                <div className="mb-4">
                                  <h3 className="text-sm font-semibold text-brand-black">
                                    Textos de este slide
                                  </h3>
                                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                    Deja un campo vacío para usar el dato original del producto. Apaga su interruptor para ocultarlo.
                                  </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`badge-${item.id}`}>Etiqueta</Label>
                                      <Switch
                                        checked={item.show_badge}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_badge: checked })
                                        }
                                        aria-label="Mostrar etiqueta"
                                      />
                                    </div>
                                    <Input
                                      id={`badge-${item.id}`}
                                      value={item.badge_text || ''}
                                      maxLength={40}
                                      disabled={!item.show_badge}
                                      placeholder="Automática: Nuevo, oferta o últimas unidades"
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { badge_text: event.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`brand-${item.id}`}>Marca</Label>
                                      <Switch
                                        checked={item.show_brand}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_brand: checked })
                                        }
                                        aria-label="Mostrar marca"
                                      />
                                    </div>
                                    <Input
                                      id={`brand-${item.id}`}
                                      value={item.brand_text || ''}
                                      maxLength={60}
                                      disabled={!item.show_brand}
                                      placeholder={item.product.brand.name}
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { brand_text: event.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`price-${item.id}`}>Precio mostrado</Label>
                                      <Switch
                                        checked={item.show_price}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_price: checked })
                                        }
                                        aria-label="Mostrar precio"
                                      />
                                    </div>
                                    <Input
                                      id={`price-${item.id}`}
                                      value={item.price_text || ''}
                                      maxLength={40}
                                      disabled={!item.show_price}
                                      placeholder={formatPrice(item.product.base_price)}
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { price_text: event.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`title-${item.id}`}>Título</Label>
                                      <Switch
                                        checked={item.show_title}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_title: checked })
                                        }
                                        aria-label="Mostrar título"
                                      />
                                    </div>
                                    <Input
                                      id={`title-${item.id}`}
                                      value={item.title_text || ''}
                                      maxLength={100}
                                      disabled={!item.show_title}
                                      placeholder={item.product.name}
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { title_text: event.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`subtitle-${item.id}`}>Texto adicional</Label>
                                      <Switch
                                        checked={item.show_subtitle}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_subtitle: checked })
                                        }
                                        aria-label="Mostrar texto adicional"
                                      />
                                    </div>
                                    <Input
                                      id={`subtitle-${item.id}`}
                                      value={item.subtitle_text || ''}
                                      maxLength={160}
                                      disabled={!item.show_subtitle}
                                      placeholder="Opcional: envío, promoción o mensaje corto"
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { subtitle_text: event.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`primary-button-${item.id}`}>Botón principal</Label>
                                      <Switch
                                        checked={item.show_primary_button}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_primary_button: checked })
                                        }
                                        aria-label="Mostrar botón principal"
                                      />
                                    </div>
                                    <Input
                                      id={`primary-button-${item.id}`}
                                      value={item.primary_button_text || ''}
                                      maxLength={32}
                                      disabled={!item.show_primary_button}
                                      placeholder="Comprar ahora"
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { primary_button_text: event.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <Label htmlFor={`secondary-button-${item.id}`}>Botón secundario</Label>
                                      <Switch
                                        checked={item.show_secondary_button}
                                        onCheckedChange={(checked) =>
                                          updateFeaturedProduct(item.id, { show_secondary_button: checked })
                                        }
                                        aria-label="Mostrar botón secundario"
                                      />
                                    </div>
                                    <Input
                                      id={`secondary-button-${item.id}`}
                                      value={item.secondary_button_text || ''}
                                      maxLength={32}
                                      disabled={!item.show_secondary_button}
                                      placeholder="Ver detalles"
                                      onChange={(event) =>
                                        updateFeaturedProduct(item.id, { secondary_button_text: event.target.value })
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                                  El precio personalizado solo cambia este anuncio. El carrito y el checkout siempre usan el precio real del producto.
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Available Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-brand-black mb-4">
            Productos Disponibles
          </h2>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAvailableProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {searchTerm
                    ? 'No se encontraron productos'
                    : 'Todos los productos ya están destacados'}
                </p>
              </div>
            ) : (
              filteredAvailableProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                    {product.colors[0]?.images[0]?.image_url ? (
                      <Image
                        src={product.colors[0].images[0].image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Sin img
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-brand-black truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.brand.name} • {formatPrice(product.base_price)}
                    </p>
                  </div>

                  {/* Add Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addProduct(product.id)}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-brand-black mb-2">Consejos</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Arrastra los productos para cambiar su orden en el carrusel</li>
          <li>• Usa el lápiz para cambiar, agregar u ocultar textos de cada slide</li>
          <li>• Usa el ícono de ojo para activar/desactivar sin eliminar</li>
          <li>• Recomendado: 3-5 productos destacados para una navegación breve</li>
          <li>• Los productos inactivos no se muestran en el carrusel público</li>
        </ul>
      </div>
    </div>
  );
}
