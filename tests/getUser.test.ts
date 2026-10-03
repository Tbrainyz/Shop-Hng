import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import { getUser } from "@/lib/getUser";

const SECRET = "test-secret-test-secret-test-secret";
beforeEach(() => { process.env.NEXTAUTH_SECRET = SECRET; delete process.env.NEXTAUTH_URL; });

const mint = (claims: Record<string, unknown>, secret = SECRET) => encode({ token: claims, secret });
const reqWith = (headers: Record<string, string>) => new NextRequest("http://localhost/api/x", { headers });

describe("getUser", () => {
  it("returns null with no cookie and no Authorization header", async () => {
    expect(await getUser(reqWith({}))).toBeNull();
  });

  it("accepts a valid bearer token (the mobile app)", async () => {
    const jwt = await mint({ sub: "google-123", email: "a@b.com" });
    expect(await getUser(reqWith({ authorization: `Bearer ${jwt}` }))).toEqual({ id: "google-123", email: "a@b.com" });
  });

  it("accepts the NextAuth session cookie (the website)", async () => {
    const jwt = await mint({ sub: "google-123", email: "a@b.com" });
    expect(await getUser(reqWith({ cookie: `next-auth.session-token=${jwt}` }))).toEqual({ id: "google-123", email: "a@b.com" });
  });

  it("falls back to the email as id when the token has no sub", async () => {
    const jwt = await mint({ email: "a@b.com" });
    expect(await getUser(reqWith({ authorization: `Bearer ${jwt}` }))).toEqual({ id: "a@b.com", email: "a@b.com" });
  });

  it("rejects a token signed with a different secret, garbage, or a non-Bearer scheme", async () => {
    const forged = await mint({ sub: "x", email: "a@b.com" }, "some-other-secret-some-other-secret");
    expect(await getUser(reqWith({ authorization: `Bearer ${forged}` }))).toBeNull();
    expect(await getUser(reqWith({ authorization: "Bearer not-a-jwt" }))).toBeNull();
    const ok = await mint({ sub: "x", email: "a@b.com" });
    expect(await getUser(reqWith({ authorization: `Basic ${ok}` }))).toBeNull();
  });

  it("rejects a valid token that carries no email", async () => {
    const jwt = await mint({ sub: "x" });
    expect(await getUser(reqWith({ authorization: `Bearer ${jwt}` }))).toBeNull();
  });
});
