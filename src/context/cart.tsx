import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export interface CartProduct {
  id: string;
  name: string;
  description: string;
  price_ngn: number;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: CartProduct | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  loading: boolean;
  addToCart: (productId: string, qty?: number) => Promise<{ error?: Error }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ error?: Error }>;
  removeItem: (productId: string) => Promise<{ error?: Error }>;
  clearCart: () => Promise<{ error?: Error }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  totalAmount: 0,
  loading: false,
  addToCart: async () => ({}),
  updateQuantity: async () => ({}),
  removeItem: async () => ({}),
  clearCart: async () => ({}),
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, user_id, product_id, quantity, product:products(id, name, description, price_ngn)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart items:', error);
        return;
      }

      // Format response to ensure product shape
      const formatted: CartItem[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        product_id: row.product_id,
        quantity: row.quantity,
        product: Array.isArray(row.product) ? row.product[0] : row.product,
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Failed to load cart items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load and Realtime listener on cart_items
  useEffect(() => {
    let active = true;

    if (!user) {
      Promise.resolve().then(() => {
        if (active) setItems([]);
      });
      return;
    }

    supabase
      .from('cart_items')
      .select('id, user_id, product_id, quantity, product:products(id, name, description, price_ngn)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active || error) return;
        const formatted: CartItem[] = (data || []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          product_id: row.product_id,
          quantity: row.quantity,
          product: Array.isArray(row.product) ? row.product[0] : row.product,
        }));
        setItems(formatted);
      });

    // Subscribe to Realtime changes on cart_items for this user
    const channel = supabase
      .channel(`public:cart_items:user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshCart();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, refreshCart]);

  // AC-M4.3: Reload cart when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshCart();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshCart]);

  const addToCart = async (productId: string, qty = 1): Promise<{ error?: Error }> => {
    if (!user) {
      return { error: new Error('You must be signed in to add items to cart') };
    }

    try {
      // 1. Try atomic add_to_cart RPC function
      const { error: rpcError } = await supabase.rpc('add_to_cart', {
        p_product_id: productId,
        p_qty: qty,
      });

      if (!rpcError) {
        await refreshCart();
        return {};
      }

      // 2. Fallback to direct table upsert if RPC is not available
      const existing = items.find((i) => i.product_id === productId);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, 99);
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (updateError) return { error: updateError };
      } else {
        const { error: insertError } = await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity: Math.min(qty, 99),
        });
        if (insertError) return { error: insertError };
      }

      await refreshCart();
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<{ error?: Error }> => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      if (quantity <= 0) {
        return removeItem(productId);
      }

      const safeQty = Math.min(Math.max(quantity, 1), 99);
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: safeQty, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) return { error };
      await refreshCart();
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const removeItem = async (productId: string): Promise<{ error?: Error }> => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) return { error };
      await refreshCart();
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const clearCart = async (): Promise<{ error?: Error }> => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) return { error };
      await refreshCart();
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.product?.price_ngn || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
