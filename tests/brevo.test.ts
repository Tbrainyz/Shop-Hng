import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/types";

const order: Order = {
  id: "order_12345678",
  userId: "u1",
  userEmail: "buyer@example.com",
  paystackReference: "ref_abc123",
  subtotalCents: 2800,
  shippingCents: 500,
  totalCents: 3300,
  shipping: {
    name: "A",
    address: "1 Main St",
    city: "Lagos",
    state: "Lagos",
    postalCode: "100001",
    country: "Nigeria",
    phone: "+234",
  },
  items: [
    {
      productId: "p1",
      name: "Classic Tote Bag",
      priceCents: 2800,
      quantity: 1,
    },
  ],
  createdAt: new Date().toISOString(),
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_FROM_EMAIL;
  delete process.env.BREVO_FROM_NAME;
});

describe("sendOrderConfirmationEmail", () => {
  it("does nothing (and doesn't throw) when Brevo isn't configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendOrderConfirmationEmail } = await import("@/lib/brevo");
    await sendOrderConfirmationEmail("buyer@example.com", order);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the sender, recipient and order content to the Brevo API", async () => {
    process.env.BREVO_API_KEY = "key123";
    process.env.BREVO_FROM_EMAIL = "orders@example.com";
    process.env.BREVO_FROM_NAME = "Hng Shop";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { sendOrderConfirmationEmail } = await import("@/lib/brevo");
    await sendOrderConfirmationEmail("buyer@example.com", order);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.headers).toEqual({
      "api-key": "key123",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(init.body);
    expect(body.sender).toEqual({
      name: "Hng Shop",
      email: "orders@example.com",
    });
    expect(body.to).toEqual([{ email: "buyer@example.com" }]);
    expect(body.subject).toContain(order.id.slice(0, 8));
    expect(body.htmlContent).toContain("Classic Tote Bag");
    expect(body.textContent).toContain("Classic Tote Bag");
  });

  it("throws when Brevo responds with a non-2xx status", async () => {
    process.env.BREVO_API_KEY = "key123";
    process.env.BREVO_FROM_EMAIL = "orders@example.com";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        }),
    );
    const { sendOrderConfirmationEmail } = await import("@/lib/brevo");
    await expect(
      sendOrderConfirmationEmail("buyer@example.com", order),
    ).rejects.toThrow(/401/);
  });
});
