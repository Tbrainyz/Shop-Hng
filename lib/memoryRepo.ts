import { randomUUID } from "node:crypto";
import { CURRENCY } from "./currency";
import type { OrderRepo, StoredCart, StoredCartItem } from "./repo";
import { getSeedProducts } from "./seedProducts";
import type { CreateOrderInput, Order, Product } from "./types";

/** In-memory store: used by tests and as a dev fallback when DATABASE_URL isn't set. */
export class MemoryOrderRepo implements OrderRepo {
  private products = new Map<string, Product>(
    getSeedProducts(CURRENCY).map((p) => { const id = randomUUID(); return [id, { id, ...p }]; }),
  );
  private orders = new Map<string, Order>();
  private usedReferences = new Set<string>();
  private carts = new Map<string, StoredCart>();

  async listProducts() { return [...this.products.values()]; }
  async getProductsByIds(ids: string[]) { return ids.map((id) => this.products.get(id)).filter((p): p is Product => !!p); }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (this.usedReferences.has(input.paystackReference)) throw new Error("payment reference already used");
    this.usedReferences.add(input.paystackReference);
    for (const item of input.items) {
      const p = this.products.get(item.productId);
      if (p) p.stock = Math.max(0, p.stock - item.quantity);
    }
    const order: Order = {
      id: randomUUID(), userId: input.userId, userEmail: input.userEmail, paystackReference: input.paystackReference,
      subtotalCents: input.subtotalCents, shippingCents: input.shippingCents, totalCents: input.totalCents,
      shipping: input.shipping, items: input.items, createdAt: new Date().toISOString(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: string, userId: string) {
    const order = this.orders.get(id);
    return order && order.userId === userId ? order : undefined;
  }

  async getCart(userId: string): Promise<StoredCart> {
    const c = this.carts.get(userId);
    return c ? { items: c.items.map((i) => ({ ...i })), rev: c.rev } : { items: [], rev: 0 };
  }

  async setCart(userId: string, items: StoredCartItem[]): Promise<StoredCart> {
    const next: StoredCart = { items: items.map((i) => ({ ...i })), rev: (this.carts.get(userId)?.rev ?? 0) + 1 };
    this.carts.set(userId, next);
    return { items: next.items.map((i) => ({ ...i })), rev: next.rev };
  }
}
