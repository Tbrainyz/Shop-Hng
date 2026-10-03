import { NextResponse } from "next/server";
import { getRepo } from "@/lib/db";
import { handle, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const product = (await (await getRepo()).listProducts()).find((p) => p.slug === slug);
  return product ? NextResponse.json(product) : notFound();
});
