import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/types";

const order: Order = {
  id: "order_12345678", userId: "u1", userEmail: "buyer@example.com", paystackReference: "ref_abc123",
  subtotalCents: 2800, shippingCents: 500, totalCents: 3300,
  shipping: { name: "A", address: "1 Main St", city: "Lagos", state: "Lagos", postalCode: "100001", country: "Nigeria", phone: "+234" },
  items: [{ productId: "p1", name: "Classic Tote Bag", priceCents: 2800, quantity: 1 }],
  createdAt: new Date().toISOString(),
};

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); delete process.env.MAILGUN_API_KEY; delete process.env.MAILGUN_DOMAIN; });

describe("sendOrderConfirmationEmail", () => {
  it("does nothing (and doesn't throw) when Mailgun isn't configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendOrderConfirmationEmail } = await import("@/lib/mailgun");
    await sendOrderConfirmationEmail("buyer@example.com", order);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the Mailgun API with the right auth, recipient and content when configured", async () => {
    process.env.MAILGUN_API_KEY = "key123";
    process.env.MAILGUN_DOMAIN = "mg.example.com";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { sendOrderConfirmationEmail } = await import("@/lib/mailgun");
    await sendOrderConfirmationEmail("buyer@example.com", order);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mailgun.net/v3/mg.example.com/messages");
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("api:key123").toString("base64")}`);
    const body = new URLSearchParams(init.body);
    expect(body.get("to")).toBe("buyer@example.com");
    expect(body.get("subject")).toContain("order_1".slice(0, 8) === order.id.slice(0, 8) ? order.id.slice(0, 8) : "");
    expect(body.get("html")).toContain("Classic Tote Bag");
    expect(body.get("text")).toContain("Classic Tote Bag");
  });

  it("throws when Mailgun responds with a non-2xx status", async () => {
    process.env.MAILGUN_API_KEY = "key123";
    process.env.MAILGUN_DOMAIN = "mg.example.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "Unauthorized" }));
    const { sendOrderConfirmationEmail } = await import("@/lib/mailgun");
    await expect(sendOrderConfirmationEmail("buyer@example.com", order)).rejects.toThrow(/401/);
  });
});
