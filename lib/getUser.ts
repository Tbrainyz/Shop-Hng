import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export interface AuthedUser { id: string; email: string }

/**
 * Identifies the caller for API routes. Accepts BOTH:
 *  - the NextAuth session cookie (the website), and
 *  - an `Authorization: Bearer <jwt>` header (the mobile app).
 * next-auth's getToken() checks the cookie first, then the bearer header, and verifies
 * the signature with NEXTAUTH_SECRET either way. Returns null when not signed in.
 * The id matches what lib/auth.ts puts on session.user.id (Google `sub`, falling back to email),
 * so an order placed on the web is visible on mobile and vice versa.
 */
export async function getUser(req: NextRequest): Promise<AuthedUser | null> {
  const token = await getToken({ req });
  if (!token?.email) return null;
  return { id: token.sub ?? token.email, email: token.email };
}
