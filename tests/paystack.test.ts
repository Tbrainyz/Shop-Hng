import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); delete process.env.PAYSTACK_SECRET_KEY; });

describe("verifyPaystackTransaction", () => {
  it("throws if PAYSTACK_SECRET_KEY isn't configured", async () => {
    const { verifyPaystackTransaction } = await import("@/lib/paystack");
    await expect(verifyPaystackTransaction("ref1")).rejects.toThrow(/PAYSTACK_SECRET_KEY/);
  });

  it("calls Paystack's verify endpoint with the secret key and returns success + amount", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_123";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ status: true, data: { status: "success", amount: 800000, currency: "NGN" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { verifyPaystackTransaction } = await import("@/lib/paystack");
    const result = await verifyPaystackTransaction("ref_abc123");

    expect(result).toEqual({ success: true, amountMinor: 800000, currency: "NGN" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.paystack.co/transaction/verify/ref_abc123");
    expect(init.headers.Authorization).toBe("Bearer sk_test_123");
  });

  it("reports failure when Paystack's own transaction status isn't success", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_123";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: true, data: { status: "failed", amount: 0, currency: "NGN" } }) }));
    const { verifyPaystackTransaction } = await import("@/lib/paystack");
    expect((await verifyPaystackTransaction("ref1")).success).toBe(false);
  });

  it("throws when the HTTP request itself fails", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_123";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => null }));
    const { verifyPaystackTransaction } = await import("@/lib/paystack");
    await expect(verifyPaystackTransaction("ref1")).rejects.toThrow(/401/);
  });
});
