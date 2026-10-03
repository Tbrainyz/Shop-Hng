import { beforeEach, describe, expect, it } from "vitest";
import { setRepo } from "@/lib/db";
import { MemoryOrderRepo } from "@/lib/memoryRepo";
import { GET as getProduct } from "@/app/api/products/[slug]/route";

const call = (slug: string) => getProduct(new Request(`http://localhost/api/products/${slug}`), { params: Promise.resolve({ slug }) });

beforeEach(() => { setRepo(new MemoryOrderRepo()); });

describe("GET /api/products/[slug]", () => {
  it("returns the product with its gallery, includes and related slugs", async () => {
    const res = await call("zx9-speaker");
    expect(res.status).toBe(200);
    const p = await res.json();
    expect(p.slug).toBe("zx9-speaker");
    expect(Array.isArray(p.gallery)).toBe(true);
    expect(Array.isArray(p.includes)).toBe(true);
    expect(Array.isArray(p.related)).toBe(true);
  });

  it("404s for an unknown slug", async () => {
    const res = await call("nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("returns a JSON 500 when the repo throws", async () => {
    setRepo({ listProducts: async () => { throw new Error("db down"); } } as any);
    expect((await call("zx9-speaker")).status).toBe(500);
  });
});
