import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { setRepo } from "@/lib/db";
import { MemoryOrderRepo } from "@/lib/memoryRepo";

vi.mock("@/lib/getUser", () => ({ getUser: vi.fn() }));

import { getUser } from "@/lib/getUser";
import { GET as getCart, PUT as putCart } from "@/app/api/cart/route";
import { GET as listProducts } from "@/app/api/products/route";

const as = (id: string | null) => vi.mocked(getUser).mockResolvedValue(id ? { id, email: `${id}@example.com` } : null);
const get = (query = "") => getCart(new NextRequest(`http://localhost/api/cart${query}`));
const put = (body?: unknown, raw?: string) =>
  putCart(new NextRequest("http://localhost/api/cart", { method: "PUT", body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) }));
const products = async () => (await (await listProducts()).json()) as { id: string; name: string; priceCents: number }[];

beforeEach(() => { setRepo(new MemoryOrderRepo()); vi.mocked(getUser).mockReset(); });

describe("/api/cart", () => {
  it("401s on both GET and PUT when not signed in", async () => {
    as(null);
    expect((await get()).status).toBe(401);
    expect((await put({ items: [] })).status).toBe(401);
  });

  it("starts empty at rev 0", async () => {
    as("u1");
    expect(await (await get()).json()).toEqual({ items: [], rev: 0 });
  });

  it("PUT saves the cart and GET returns it hydrated with name, image and price", async () => {
    as("u1");
    const [p] = await products();
    const res = await put({ items: [{ productId: p.id, quantity: 2 }] });
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved.rev).toBe(1);
    expect(saved.items).toEqual([{ productId: p.id, name: p.name, image: expect.any(String), priceCents: p.priceCents, quantity: 2 }]);
    expect(await (await get()).json()).toEqual(saved);
  });

  it("is shared between devices: whoever has the same user id sees the same cart (web <-> mobile)", async () => {
    const [p] = await products();
    as("u1"); // "website"
    await put({ items: [{ productId: p.id, quantity: 3 }] });
    as("u1"); // "phone" — a different client, same account
    const onPhone = await (await get()).json();
    expect(onPhone.items[0].quantity).toBe(3);
  });

  it("keeps each user's cart private", async () => {
    const [p] = await products();
    as("u1");
    await put({ items: [{ productId: p.id, quantity: 1 }] });
    as("u2");
    expect((await (await get()).json()).items).toEqual([]);
  });

  it("bumps rev on every write and answers ?since= cheaply when nothing changed", async () => {
    as("u1");
    const [p] = await products();
    await put({ items: [{ productId: p.id, quantity: 1 }] });
    await put({ items: [{ productId: p.id, quantity: 2 }] });
    expect(await (await get("?since=2")).json()).toEqual({ unchanged: true, rev: 2 });
    const stale = await (await get("?since=1")).json();
    expect(stale.rev).toBe(2);
    expect(stale.items[0].quantity).toBe(2);
  });

  it("PUT replaces the whole cart, and an empty list empties it", async () => {
    as("u1");
    const [a, b] = await products();
    await put({ items: [{ productId: a.id, quantity: 1 }] });
    await put({ items: [{ productId: b.id, quantity: 1 }] });
    expect((await (await get()).json()).items.map((i: any) => i.productId)).toEqual([b.id]);
    await put({ items: [] });
    expect((await (await get()).json()).items).toEqual([]);
  });

  it("merges duplicate lines, caps quantity at 99, and drops unknown products", async () => {
    as("u1");
    const [p] = await products();
    const res = await (await put({ items: [{ productId: p.id, quantity: 60 }, { productId: p.id, quantity: 60 }, { productId: "ghost", quantity: 1 }] })).json();
    expect(res.items).toHaveLength(1);
    expect(res.items[0].quantity).toBe(99);
  });

  it("400s for malformed JSON, a missing items list, bad quantities, and oversized carts", async () => {
    as("u1");
    const [p] = await products();
    expect((await put(undefined, "{bad")).status).toBe(400);
    expect((await put({})).status).toBe(400);
    expect((await put({ items: [{ productId: p.id, quantity: 0 }] })).status).toBe(400);
    expect((await put({ items: [{ productId: p.id, quantity: 100 }] })).status).toBe(400);
    expect((await put({ items: [{ productId: p.id, quantity: 1.5 }] })).status).toBe(400);
    expect((await put({ items: Array.from({ length: 51 }, () => ({ productId: p.id, quantity: 1 })) })).status).toBe(400);
  });

  it("returns a JSON 500 when the repo throws", async () => {
    as("u1");
    setRepo({ getCart: async () => { throw new Error("db down"); } } as any);
    const res = await get();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal server error" });
  });
});
