'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './auth-context';

interface CartItemVariant {
  id: string;
  size_us: number;
  size_eu: number;
  sku: string;
  stock_quantity: number;
  product_color: {
    id: string;
    color_name: string;
    color_code: string;
    images: { image_url: string }[];
    product: {
      id: string;
      name: string;
      slug: string;
      base_price: number;
      compare_at_price: number | null;
      brand: { name: string };
    };
  };
}

export interface CartItem {
  id: string;
  variant_id: string;
  quantity: number;
  price_at_add: number;
  variant: CartItemVariant;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Local storage key for guest cart
const GUEST_CART_KEY = 'flipflop_guest_cart';

interface GuestCartItem {
  variantId: string;
  quantity: number;
  addedAt: number;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  const supabase = createClient();

  // Fetch cart items from database
  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          variant_id,
          quantity,
          price_at_add,
          variant:product_variants!inner(
            id,
            size_us,
            size_eu,
            sku,
            stock_quantity,
            product_color:product_colors!inner(
              id,
              color_name,
              color_code,
              images:product_color_images(image_url),
              product:products!inner(
                id,
                name,
                slug,
                base_price,
                compare_at_price,
                brand:brands(name)
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform nested data
      const transformedItems: CartItem[] = (data || []).map((item: any) => ({
        id: item.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_add: item.price_at_add,
        variant: {
          ...item.variant,
          product_color: {
            ...item.variant.product_color,
            images: item.variant.product_color.images || [],
            product: item.variant.product_color.product,
          },
        },
      }));

      setItems(transformedItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Sync guest cart to database when user logs in
  const syncGuestCart = useCallback(async () => {
    if (!user) return;

    try {
      const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
      if (!guestCartJson) return;

      const guestCart: GuestCartItem[] = JSON.parse(guestCartJson);
      if (guestCart.length === 0) return;

      // Get prices for variants
      const variantIds = guestCart.map(item => item.variantId);
      const { data: variants } = await supabase
        .from('product_variants')
        .select(`
          id,
          product:products(base_price)
        `)
        .in('id', variantIds);

      const priceMap = new Map(
        (variants || []).map((v: any) => [v.id, v.product?.base_price || 0])
      );

      // Add each guest item to database
      for (const item of guestCart) {
        const price = priceMap.get(item.variantId) || 0;

        // Check if item already exists
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('variant_id', item.variantId)
          .single();

        if (existing) {
          // Update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + item.quantity })
            .eq('id', existing.id);
        } else {
          // Insert new item
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              variant_id: item.variantId,
              quantity: item.quantity,
              price_at_add: price,
            });
        }
      }

      // Clear guest cart
      localStorage.removeItem(GUEST_CART_KEY);
    } catch (error) {
      console.error('Error syncing guest cart:', error);
    }
  }, [user, supabase]);

  // Load cart on mount and auth changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      syncGuestCart().then(() => fetchCartItems());
    } else {
      // Load guest cart from localStorage
      loadGuestCart();
    }
  }, [user, authLoading, fetchCartItems, syncGuestCart]);

  // Load guest cart from localStorage
  const loadGuestCart = async () => {
    try {
      const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
      if (!guestCartJson) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const guestCart: GuestCartItem[] = JSON.parse(guestCartJson);
      if (guestCart.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // Fetch variant details
      const variantIds = guestCart.map(item => item.variantId);
      const { data: variants } = await supabase
        .from('product_variants')
        .select(`
          id,
          size_us,
          size_eu,
          sku,
          stock_quantity,
          product_color:product_colors!inner(
            id,
            color_name,
            color_code,
            images:product_color_images(image_url),
            product:products!inner(
              id,
              name,
              slug,
              base_price,
              compare_at_price,
              brand:brands(name)
            )
          )
        `)
        .in('id', variantIds);

      const variantMap = new Map((variants || []).map((v: any) => [v.id, v]));

      const transformedItems: CartItem[] = guestCart
        .filter(item => variantMap.has(item.variantId))
        .map(item => {
          const variant = variantMap.get(item.variantId)!;
          return {
            id: `guest-${item.variantId}`,
            variant_id: item.variantId,
            quantity: item.quantity,
            price_at_add: variant.product_color.product.base_price,
            variant: {
              ...variant,
              product_color: {
                ...variant.product_color,
                images: variant.product_color.images || [],
              },
            },
          };
        });

      setItems(transformedItems);
    } catch (error) {
      console.error('Error loading guest cart:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) return;

    const timeout = window.setTimeout(() => {
      setItems([]);
      setIsLoading(false);
    }, 7000);

    return () => window.clearTimeout(timeout);
  }, [isLoading]);

  // Add item to cart
  const addItem = useCallback(async (variantId: string, quantity = 1): Promise<boolean> => {
    try {
      // Get variant details and price
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          stock_quantity,
          product:products(base_price)
        `)
        .eq('id', variantId)
        .single();

      if (variantError || !variant) {
        console.error('Variant not found');
        return false;
      }

      // Check stock
      if (variant.stock_quantity < quantity) {
        console.error('Not enough stock');
        return false;
      }

      const price = (variant as any).product?.base_price || 0;

      if (user) {
        // Authenticated user - save to database
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('variant_id', variantId)
          .single();

        if (existing) {
          const newQuantity = Math.min(existing.quantity + quantity, variant.stock_quantity);
          await supabase
            .from('cart_items')
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              variant_id: variantId,
              quantity,
              price_at_add: price,
            });
        }

        await fetchCartItems();
      } else {
        // Guest user - save to localStorage
        const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
        const guestCart: GuestCartItem[] = guestCartJson ? JSON.parse(guestCartJson) : [];

        const existingIndex = guestCart.findIndex(item => item.variantId === variantId);
        if (existingIndex >= 0) {
          guestCart[existingIndex].quantity = Math.min(
            guestCart[existingIndex].quantity + quantity,
            variant.stock_quantity
          );
        } else {
          guestCart.push({ variantId, quantity, addedAt: Date.now() });
        }

        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
        await loadGuestCart();
      }

      setIsOpen(true);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }, [user, supabase, fetchCartItems]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      if (user) {
        await supabase
          .from('cart_items')
          .update({ quantity, updated_at: new Date().toISOString() })
          .eq('id', itemId);
        await fetchCartItems();
      } else {
        const variantId = itemId.replace('guest-', '');
        const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
        const guestCart: GuestCartItem[] = guestCartJson ? JSON.parse(guestCartJson) : [];

        const index = guestCart.findIndex(item => item.variantId === variantId);
        if (index >= 0) {
          guestCart[index].quantity = quantity;
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
          await loadGuestCart();
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }, [user, supabase, fetchCartItems]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        await fetchCartItems();
      } else {
        const variantId = itemId.replace('guest-', '');
        const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
        const guestCart: GuestCartItem[] = guestCartJson ? JSON.parse(guestCartJson) : [];

        const filtered = guestCart.filter(item => item.variantId !== variantId);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(filtered));
        await loadGuestCart();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }, [user, supabase, fetchCartItems]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
        setItems([]);
      } else {
        localStorage.removeItem(GUEST_CART_KEY);
        setItems([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, [user, supabase]);

  // Calculate totals
  const itemCount = useMemo(() =>
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(() =>
    items.reduce((sum, item) => {
      const price = item.variant.product_color.product.base_price;
      return sum + (price * item.quantity);
    }, 0),
    [items]
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        isOpen,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
