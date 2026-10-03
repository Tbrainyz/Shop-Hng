import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/getUser";
import { handle, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Who am I? The mobile token is encrypted, so the app asks the server instead of decoding it. Also doubles as a "is my token still valid?" check. */
export const GET = handle(async (req: NextRequest) => {
  const user = await getUser(req);
  if (!user) return unauthorized();
  return NextResponse.json(user);
});
