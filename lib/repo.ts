import type { CreateOrderInput, Order, Product } from "./types";

export interface OrderRepo {
  listProducts(): Promise<Product[]>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  /** Returns undefined if the order doesn't exist OR doesn't belong to userId — callers should treat both as 404. */
  getOrder(id: string, userId: string): Promise<Order | undefined>;
}
