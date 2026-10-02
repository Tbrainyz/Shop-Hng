import { Prisma } from "@prisma/client";
import { prisma } from "./prismaClient";
import type { OrderRepo } from "./repo";
import type { CreateOrderInput, Order, Product } from "./types";

const toProduct = (p: any): Product => ({
  id: p.id, slug: p.slug, name: p.name, description: p.description, category: p.category,
  priceCents: p.priceCents, stock: p.stock, image: p.image, gallery: p.gallery, features: p.features,
  includes: p.includes, related: p.related, isNew: p.isNew, featured: p.featured,
});
const toOrder = (o: any): Order => ({
  id: o.id, userId: o.userId, userEmail: o.userEmail, paystackReference: o.paystackReference,
  subtotalCents: o.subtotalCents, shippingCents: o.shippingCents, totalCents: o.totalCents,
  shipping: {
    name: o.shippingName, address: o.shippingAddress, city: o.shippingCity, state: o.shippingState,
    postalCode: o.shippingPostalCode, country: o.shippingCountry, phone: o.shippingPhone,
  },
  items: o.items.map((i: any) => ({ productId: i.productId, name: i.name, priceCents: i.priceCents, quantity: i.quantity })),
  createdAt: o.createdAt.toISOString(),
});

export class PrismaOrderRepo implements OrderRepo {
  async listProducts() { return (await prisma.product.findMany({ orderBy: { name: "asc" } })).map(toProduct); }
  async getProductsByIds(ids: string[]) { return (await prisma.product.findMany({ where: { id: { in: ids } } })).map(toProduct); }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const o = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of input.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      return tx.order.create({
        data: {
          userId: input.userId, userEmail: input.userEmail, paystackReference: input.paystackReference,
          subtotalCents: input.subtotalCents, shippingCents: input.shippingCents, totalCents: input.totalCents,
          shippingName: input.shipping.name, shippingAddress: input.shipping.address, shippingCity: input.shipping.city,
          shippingState: input.shipping.state, shippingPostalCode: input.shipping.postalCode,
          shippingCountry: input.shipping.country, shippingPhone: input.shipping.phone,
          items: { create: input.items.map((i) => ({ productId: i.productId, name: i.name, priceCents: i.priceCents, quantity: i.quantity })) },
        },
        include: { items: true },
      });
    });
    return toOrder(o);
  }

  async getOrder(id: string, userId: string) {
    const o = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    return o && o.userId === userId ? toOrder(o) : undefined;
  }
}
