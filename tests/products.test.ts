import { beforeEach, describe, expect, it } from "vitest";
import { setRepo } from "@/lib/db";
import { MemoryOrderRepo } from "@/lib/memoryRepo";
import { GET as listProducts } from "@/app/api/products/route";

beforeEach(() => setRepo(new MemoryOrderRepo()));

describe("GET /api/products", () => {
  it("returns the seeded catalog", async () => {
    const res = await listProducts();
    expect(res.status).toBe(200);
    const products = await res.json();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("priceCents");
    expect(products[0]).toHaveProperty("stock");
  });

  it("returns a JSON 500 when the repo throws", async () => {
    setRepo({ listProducts: async () => { throw new Error("db down"); } } as any);
    const res = await listProducts();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal server error" });
  });
});

describe("GET /api/products catalog", () => {
  it("includes all three real categories with slugs and gallery data", async () => {
    const products = await (await listProducts()).json();
    const categories = new Set(products.map((p: any) => p.category));
    expect(categories).toEqual(new Set(["headphones", "speakers", "earphones"]));
    for (const p of products) {
      expect(p.slug).toBeTruthy();
      expect(Array.isArray(p.gallery)).toBe(true);
      expect(Array.isArray(p.related)).toBe(true);
    }
  });
  it("every related slug points at a product that actually exists in the catalog", async () => {
    const products = await (await listProducts()).json();
    const slugs = new Set(products.map((p: any) => p.slug));
    for (const p of products) for (const r of p.related) expect(slugs.has(r)).toBe(true);
  });
});
