import type { CreateOrderInput, Order, Product } from "./types";

export interface StoredCartItem { productId: string; quantity: number }
/** `rev` goes up by one on every write (0 = no cart yet). Clients use it to ask "has the cart changed since rev N?". */
export interface StoredCart { items: StoredCartItem[]; rev: number }

export interface OrderRepo {
  listProducts(): Promise<Product[]>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  /** Returns undefined if the order doesn't exist OR doesn't belong to userId — callers should treat both as 404. */
  getOrder(id: string, userId: string): Promise<Order | undefined>;
  /** The signed-in user's server-side cart (shared by the website and the mobile app). Never undefined: empty cart = rev 0. */
  getCart(userId: string): Promise<StoredCart>;
  /** Replaces the whole cart (last write wins) and bumps rev. */
  setCart(userId: string, items: StoredCartItem[]): Promise<StoredCart>;
}
