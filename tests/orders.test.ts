import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { setRepo, getRepo } from "@/lib/db";
import { MemoryOrderRepo } from "@/lib/memoryRepo";

vi.mock("@/lib/getUser", () => ({ getUser: vi.fn() }));

import { getUser } from "@/lib/getUser";
import { GET as getOrder } from "@/app/api/orders/[id]/route";

const call = (id: string) =>
  getOrder(new NextRequest(`http://localhost/api/orders/${id}`), { params: Promise.resolve({ id }) });
const as = (id: string | null) =>
  vi.mocked(getUser).mockResolvedValue(id ? { id, email: `${id}@example.com` } : null);

async function seedOrder(userId: string) {
  const repo = await getRepo();
  const [p] = await repo.listProducts();
  return repo.createOrder({
    userId, userEmail: `${userId}@example.com`, paystackReference: `ref_${userId}_${Math.random()}`,
    items: [{ productId: p.id, name: p.name, priceCents: p.priceCents, quantity: 1 }],
    shipping: { name: "A", address: "1 Main", city: "Lagos", state: "Lagos", postalCode: "1", country: "NG", phone: "1" },
    subtotalCents: p.priceCents, shippingCents: 0, totalCents: p.priceCents,
  });
}

beforeEach(() => { setRepo(new MemoryOrderRepo()); vi.mocked(getUser).mockReset(); });

describe("GET /api/orders/[id]", () => {
  it("401s when not signed in", async () => {
    as(null);
    const order = await seedOrder("u1");
    expect((await call(order.id)).status).toBe(401);
  });

  it("returns the caller's own order", async () => {
    as("u1");
    const order = await seedOrder("u1");
    const res = await call(order.id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(order.id);
    expect(body.items).toHaveLength(1);
    expect(body.shipping.city).toBe("Lagos");
  });

  it("404s for an unknown id", async () => {
    as("u1");
    expect((await call("does-not-exist")).status).toBe(404);
  });

  it("404s (not 403) for someone else's order, so ids can't be probed", async () => {
    const order = await seedOrder("u1");
    as("u2");
    expect((await call(order.id)).status).toBe(404);
  });

  it("returns a JSON 500 when the repo throws", async () => {
    as("u1");
    setRepo({ getOrder: async () => { throw new Error("db down"); } } as any);
    const res = await call("x");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal server error" });
  });
});
