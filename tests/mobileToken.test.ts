import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth/jwt", async (orig) => ({ ...(await orig<typeof import("next-auth/jwt")>()), getToken: vi.fn() }));

import { getToken } from "next-auth/jwt";
import { GET as mobileToken } from "@/app/api/mobile/token/route";
import { getUser } from "@/lib/getUser";

const SECRET = "test-secret-test-secret-test-secret";
const REDIRECT = "shopmobile://auth";
const call = (redirect?: string) =>
  mobileToken(new NextRequest(`http://localhost/api/mobile/token${redirect === undefined ? "" : `?redirect=${encodeURIComponent(redirect)}`}`));
const signedIn = () => vi.mocked(getToken).mockResolvedValue({ sub: "google-123", email: "a@b.com", name: "A" } as any);

beforeEach(() => { vi.mocked(getToken).mockReset(); process.env.NEXTAUTH_SECRET = SECRET; });

describe("GET /api/mobile/token", () => {
  it("400s for a missing or disallowed redirect, without even looking at the session", async () => {
    expect((await call()).status).toBe(400);
    expect((await call("https://evil.com")).status).toBe(400);
    expect((await call("exp://evil.example.com/--/auth")).status).toBe(400);
    expect(getToken).not.toHaveBeenCalled();
  });

  it("401s when the browser has no web session", async () => {
    vi.mocked(getToken).mockResolvedValue(null);
    expect((await call(REDIRECT)).status).toBe(401);
  });

  it("401s when the session has no email", async () => {
    vi.mocked(getToken).mockResolvedValue({ sub: "x" } as any);
    expect((await call(REDIRECT)).status).toBe(401);
  });

  it("redirects back to the app with a token that the API then accepts as a bearer token", async () => {
    signedIn();
    const res = await call(REDIRECT);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const location = new URL(res.headers.get("location")!);
    expect(location.protocol).toBe("shopmobile:");
    const token = location.searchParams.get("token")!;
    expect(token).toBeTruthy();

    // round trip through the real getUser (un-mock getToken for this one call)
    const real = await vi.importActual<typeof import("next-auth/jwt")>("next-auth/jwt");
    vi.mocked(getToken).mockImplementation(real.getToken as any);
    const user = await getUser(new NextRequest("http://localhost/api/orders/x", { headers: { authorization: `Bearer ${token}` } }));
    expect(user).toEqual({ id: "google-123", email: "a@b.com" });
  });

  it("works for an Expo Go redirect on the local network", async () => {
    signedIn();
    const res = await call("exp://192.168.1.20:8081/--/auth");
    expect(res.headers.get("location")).toMatch(/^exp:\/\/192\.168\.1\.20:8081\/--\/auth\?token=/);
  });

  it("returns a JSON 500 (not a crash) when NEXTAUTH_SECRET is missing", async () => {
    signedIn();
    delete process.env.NEXTAUTH_SECRET;
    const res = await call(REDIRECT);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal server error" });
  });
});
