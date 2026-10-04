import React, { createContext, useContext, useState } from 'react';

interface CartContextType {
  itemCount: number;
  setItemCount: (count: number) => void;
}

const CartContext = createContext<CartContextType>({
  itemCount: 0,
  setItemCount: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState<number>(0);

  return (
    <CartContext.Provider value={{ itemCount, setItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
