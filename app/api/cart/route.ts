import { NextResponse, type NextRequest } from "next/server";
import { getRepo } from "@/lib/db";
import { getUser } from "@/lib/getUser";
import { badRequest, handle, unauthorized } from "@/lib/http";
import { cartSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * The signed-in user's cart, shared by the website and the mobile app (both send their own login:
 * cookie on the web, bearer token on mobile — getUser accepts either, so they resolve to the SAME user id).
 *
 * The cart is stored as just {productId, quantity}. Responses are "hydrated" with the product's current
 * name / image / price so clients can render it without a second request — and prices can't go stale.
 */
async function hydrated(repo: Awaited<ReturnType<typeof getRepo>>, stored: { items: { productId: string; quantity: number }[]; rev: number }) {
  const products = await repo.getProductsByIds(stored.items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = stored.items.flatMap((i) => {
    const p = byId.get(i.productId);
    return p ? [{ productId: p.id, name: p.name, image: p.image, priceCents: p.priceCents, quantity: i.quantity }] : []; // product deleted -> drop line
  });
  return { items, rev: stored.rev };
}

/** GET /api/cart            -> { items, rev }
 *  GET /api/cart?since=<n>  -> { unchanged: true, rev } when nothing changed since rev n (cheap, used for polling) */
export const GET = handle(async (req: NextRequest) => {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const repo = await getRepo();
  const stored = await repo.getCart(user.id);
  const since = req.nextUrl.searchParams.get("since");
  if (since !== null && Number(since) === stored.rev) return NextResponse.json({ unchanged: true, rev: stored.rev });
  return NextResponse.json(await hydrated(repo, stored));
});

/** PUT /api/cart { items: [{productId, quantity}] } replaces the whole cart (last write wins). */
export const PUT = handle(async (req: NextRequest) => {
  const user = await getUser(req);
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("invalid JSON body"); }
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "invalid cart");

  const repo = await getRepo();
  // Merge duplicate lines and drop products that don't exist.
  const merged = new Map<string, number>();
  for (const i of parsed.data.items) merged.set(i.productId, Math.min(99, (merged.get(i.productId) ?? 0) + i.quantity));
  const known = new Set((await repo.getProductsByIds([...merged.keys()])).map((p) => p.id));
  const items = [...merged].filter(([id]) => known.has(id)).map(([productId, quantity]) => ({ productId, quantity }));

  return NextResponse.json(await hydrated(repo, await repo.setCart(user.id, items)));
});
