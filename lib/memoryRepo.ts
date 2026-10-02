import { randomUUID } from "node:crypto";
import { CURRENCY } from "./currency";
import type { OrderRepo } from "./repo";
import { getSeedProducts } from "./seedProducts";
import type { CreateOrderInput, Order, Product } from "./types";

/** In-memory store: used by tests and as a dev fallback when DATABASE_URL isn't set. */
export class MemoryOrderRepo implements OrderRepo {
  private products = new Map<string, Product>(
    getSeedProducts(CURRENCY).map((p) => { const id = randomUUID(); return [id, { id, ...p }]; }),
  );
  private orders = new Map<string, Order>();
  private usedReferences = new Set<string>();

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
}
