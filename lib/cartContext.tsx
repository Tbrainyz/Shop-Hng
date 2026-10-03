"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { mergeCarts, sameCart } from "./cartMerge";
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
const POLL_MS = 2000;          // how often a signed-in tab asks "did my cart change on another device?"
const PUSH_DEBOUNCE_MS = 200;  // collapse rapid +/- clicks into one save
const MAX_QTY = 99;

type ServerCart = { items: CartItem[]; rev: number; unchanged?: boolean };

async function fetchCart(since?: number): Promise<ServerCart> {
  const res = await fetch(since === undefined ? "/api/cart" : `/api/cart?since=${since}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`cart fetch failed (${res.status})`);
  return res.json();
}
async function saveCart(items: CartItem[]): Promise<ServerCart> {
  const res = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
  });
  if (!res.ok) throw new Error(`cart save failed (${res.status})`);
  return res.json();
}

/**
 * Cart state with two modes:
 *  - Guest: lives in localStorage on this browser only (as before).
 *  - Signed in: the SERVER is the source of truth (/api/cart), shared with the mobile app.
 *      * every change is pushed to the server (debounced);
 *      * every 2s (and when the tab regains focus) we ask the server whether the cart changed elsewhere and, if so, show it.
 *      * at sign-in a guest cart is merged into the saved cart once.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Mirrors of state that async code needs to read without going stale.
  const itemsRef = useRef<CartItem[]>([]);
  const authedRef = useRef(false);
  const synced = useRef(false);        // initial reconcile with the server finished
  const rev = useRef(0);               // last server revision we know about
  const dirty = useRef(false);         // local changes not yet saved to the server
  const localVersion = useRef(0);      // bumped by every local change
  const inFlight = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const commit = useCallback((next: CartItem[]) => { itemsRef.current = next; setItems(next); }, []);

  // Guest cart from this browser.
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(raw)) commit(raw);
    } catch { /* ignore */ }
    setLoaded(true);
  }, [commit]);

  // Only guests persist locally. For signed-in users the server is the truth, so a stale local copy can never resurrect removed items.
  useEffect(() => {
    if (loaded && status === "unauthenticated") {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
    }
  }, [items, loaded, status]);

  const flush = useCallback(async () => {
    if (!authedRef.current || !synced.current) return;
    if (inFlight.current) { again.current = true; return; }
    inFlight.current = true;
    try {
      do {
        again.current = false;
        const v = localVersion.current;
        const res = await saveCart(itemsRef.current);
        rev.current = res.rev;
        if (v === localVersion.current) dirty.current = false;
        else again.current = true; // user changed things while we were saving: save again
      } while (again.current && authedRef.current);
    } catch {
      /* offline / server error: stays dirty and is retried on the next poll tick */
    } finally {
      inFlight.current = false;
    }
  }, []);

  const mutate = useCallback((fn: (prev: CartItem[]) => CartItem[]) => {
    commit(fn(itemsRef.current));
    localVersion.current += 1;
    dirty.current = true;
    if (authedRef.current) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { void flush(); }, PUSH_DEBOUNCE_MS);
    }
  }, [commit, flush]);

  // Sign-in reconcile + live polling.
  useEffect(() => {
    authedRef.current = authed;
    if (!loaded) return;

    if (!authed) {
      if (synced.current) {
        // They signed out: don't leave their cart on a shared computer.
        commit([]);
        try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      }
      synced.current = false; rev.current = 0; dirty.current = false;
      return;
    }

    let stop = false;
    let reconciling = false;

    const reconcile = async () => {
      if (reconciling) return;
      reconciling = true;
      try {
        const res = await fetchCart();
        if (stop) return;
        const guest = itemsRef.current;
        rev.current = res.rev;
        if (guest.length === 0 || sameCart(guest, res.items)) {
          commit(res.items);
        } else {
          commit(mergeCarts(res.items, guest)); // guest cart + saved cart
          localVersion.current += 1;
          dirty.current = true;
        }
        try { localStorage.removeItem(KEY); } catch { /* ignore */ }
        synced.current = true;
        if (dirty.current) void flush();
      } finally {
        reconciling = false;
      }
    };

    const tick = async () => {
      if (stop || document.hidden) return;
      if (!synced.current) { void reconcile().catch(() => {}); return; }
      if (dirty.current || inFlight.current) {
        if (dirty.current && !inFlight.current) void flush(); // retry a failed save
        return;
      }
      try {
        const v = localVersion.current;
        const res = await fetchCart(rev.current);
        if (stop || res.unchanged) return;
        if (v !== localVersion.current || dirty.current || inFlight.current) return; // user edited meanwhile: their change wins
        rev.current = res.rev;
        if (JSON.stringify(res.items) !== JSON.stringify(itemsRef.current)) commit(res.items);
      } catch { /* offline: try again next tick */ }
    };

    void reconcile().catch(() => {});
    const id = setInterval(() => { void tick(); }, POLL_MS);
    const onWake = () => { if (!document.hidden) void tick(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      stop = true;
      clearInterval(id);
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [authed, loaded, commit, flush]);

  const add: CartContextValue["add"] = (product, quantity = 1) => {
    mutate((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => (i.productId === product.id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i));
      return [...prev, { productId: product.id, name: product.name, image: product.image, priceCents: product.priceCents, quantity: Math.min(MAX_QTY, quantity) }];
    });
  };
  const updateQuantity: CartContextValue["updateQuantity"] = (productId, quantity) => {
    mutate((prev) => (quantity <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i))));
  };
  const remove: CartContextValue["remove"] = (productId) => mutate((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => mutate(() => []);
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
