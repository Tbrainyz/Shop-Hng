import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/getUser", () => ({ getUser: vi.fn() }));

import { getUser } from "@/lib/getUser";
import { GET as me } from "@/app/api/me/route";

const call = () => me(new NextRequest("http://localhost/api/me"));
beforeEach(() => { vi.mocked(getUser).mockReset(); });

describe("GET /api/me", () => {
  it("401s when not signed in", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    expect((await call()).status).toBe(401);
  });

  it("returns the signed-in user's id and email", async () => {
    vi.mocked(getUser).mockResolvedValue({ id: "u1", email: "a@b.com" });
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns a JSON 500 when auth lookup throws", async () => {
    vi.mocked(getUser).mockImplementation(async () => { throw new Error("boom"); });
    const res = await call();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal server error" });
  });
});
