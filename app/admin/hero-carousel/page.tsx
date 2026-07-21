'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, EyeOff, Trash2, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface FeaturedProduct {
  id: string;
  product_id: string;
  display_order: number;
  is_active: boolean;
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

    if (!error && data) {
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

    if (!error && data) {
      setAvailableProducts(data as any);
    }
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

    // Save to database
    setIsSaving(true);
    for (const item of updatedItems) {
      await supabase
        .from('featured_products')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
    }
    setIsSaving(false);
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
    }
  };

  const removeProduct = async (featuredProductId: string) => {
    await supabase
      .from('featured_products')
      .delete()
      .eq('id', featuredProductId);

    setFeaturedProducts(featuredProducts.filter(fp => fp.id !== featuredProductId));
  };

  const toggleActive = async (featuredProductId: string, currentActive: boolean) => {
    await supabase
      .from('featured_products')
      .update({ is_active: !currentActive })
      .eq('id', featuredProductId);

    setFeaturedProducts(
      featuredProducts.map(fp =>
        fp.id === featuredProductId ? { ...fp, is_active: !currentActive } : fp
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
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Hero Carousel</h1>
        <p className="text-gray-600 mt-1">
          Gestiona los productos destacados del carrusel principal. Arrastra para reordenar.
        </p>
      </div>

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
        <h3 className="font-medium text-brand-black mb-2">💡 Consejos</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Arrastra los productos para cambiar su orden en el carrusel</li>
          <li>• Usa el ícono de ojo para activar/desactivar sin eliminar</li>
          <li>• Recomendado: 5-8 productos destacados para mejor experiencia</li>
          <li>• Los productos inactivos no se muestran en el carrusel público</li>
        </ul>
      </div>
    </div>
  );
}
