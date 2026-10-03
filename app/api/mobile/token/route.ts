import { NextResponse, type NextRequest } from "next/server";
import { encode, getToken } from "next-auth/jwt";
import { badRequest, handle, unauthorized } from "@/lib/http";
import { appendToken, isAllowedMobileRedirect } from "@/lib/mobileRedirect";

export const dynamic = "force-dynamic";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Last step of mobile Google sign-in. The in-app browser arrives here carrying the web session
 * cookie (set by NextAuth after Google). We mint a bearer token from it and bounce back to the app.
 */
export const GET = handle(async (req: NextRequest) => {
  const redirect = req.nextUrl.searchParams.get("redirect");
  if (!isAllowedMobileRedirect(redirect)) return badRequest("invalid redirect");

  const session = await getToken({ req });
  if (!session?.email) return unauthorized();

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");

  // Only what the API needs (keeps the token small enough for the phone's secure storage; no profile picture etc).
  const claims = { sub: session.sub, email: session.email, name: session.name };
  const jwt = await encode({ token: claims, secret, maxAge: THIRTY_DAYS });
  const res = NextResponse.redirect(appendToken(redirect, jwt));
  res.headers.set("Cache-Control", "no-store");
  return res;
});
