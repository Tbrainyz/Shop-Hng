import { NextResponse, type NextRequest } from "next/server";
import { getRepo } from "@/lib/db";
import { getUser } from "@/lib/getUser";
import { handle, notFound, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  // getOrder returns undefined for "doesn't exist" AND "belongs to someone else" — both are a 404.
  const order = await (await getRepo()).getOrder(id, user.id);
  if (!order) return notFound();
  return NextResponse.json(order);
});
