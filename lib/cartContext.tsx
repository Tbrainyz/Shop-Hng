"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "./types";

export interface CartItem { productId: string; name: string; image: string; priceCents: number; quantity: number }
interface CartContextValue {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "cart:v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(items)); }, [items, loaded]);

  const add: CartContextValue["add"] = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i));
      return [...prev, { productId: product.id, name: product.name, image: product.image, priceCents: product.priceCents, quantity }];
    });
  };
  const updateQuantity: CartContextValue["updateQuantity"] = (productId, quantity) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))));
  };
  const remove: CartContextValue["remove"] = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, updateQuantity, remove, clear, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
