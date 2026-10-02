import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { computeTotals } from "@/lib/cart";
import { setRepo } from "@/lib/db";
import { MemoryOrderRepo } from "@/lib/memoryRepo";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/brevo", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/paystack", () => ({ verifyPaystackTransaction: vi.fn() }));

import { getServerSession } from "next-auth";
import { sendOrderConfirmationEmail } from "@/lib/brevo";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { POST as checkout } from "@/app/api/checkout/route";
import { GET as listProducts } from "@/app/api/products/route";

const session = (email: string | null) =>
  vi
    .mocked(getServerSession)
    .mockResolvedValue(email ? ({ user: { id: "u1", email } } as any) : null);

/** Simulates a successful, correctly-priced Paystack charge for whatever total the test expects. */
const paidSuccessfully = (amountMinor: number, currency = "USD") =>
  vi
    .mocked(verifyPaystackTransaction)
    .mockResolvedValue({ success: true, amountMinor, currency });

const req = (body?: unknown, raw?: string) =>
  new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });

const shipping = {
  name: "A",
  address: "1 Main St",
  city: "Lagos",
  state: "Lagos",
  postalCode: "100001",
  country: "Nigeria",
  phone: "+234",
};
const base = { shipping, paystackReference: "ref_test_123" };
async function firstProduct() {
  return (await (await listProducts()).json())[0];
}

beforeEach(() => {
  setRepo(new MemoryOrderRepo());
  vi.mocked(sendOrderConfirmationEmail)
    .mockClear()
    .mockResolvedValue(undefined);
  vi.mocked(verifyPaystackTransaction).mockReset();
  process.env.PAYSTACK_SECRET_KEY = "sk_test_mock";
});

describe("POST /api/checkout", () => {
  it("400s when PAYSTACK_SECRET_KEY isn't configured on the server (checked before calling Paystack)", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    session("buyer@example.com");
    const p = await firstProduct();
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 1 }], ...base }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/PAYSTACK_SECRET_KEY/);
    expect(verifyPaystackTransaction).not.toHaveBeenCalled();
  });
  it("401s when there's no session", async () => {
    session(null);
    const res = await checkout(req({ items: [], ...base }));
    expect(res.status).toBe(401);
  });

  it("400s when paystackReference is missing", async () => {
    session("buyer@example.com");
    const p = await firstProduct();
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 1 }], shipping }),
    );
    expect(res.status).toBe(400);
  });

  it("creates an order and sends a confirmation email once payment is verified for the right amount", async () => {
    session("buyer@example.com");
    const p = await firstProduct();
    paidSuccessfully(
      computeTotals([{ priceCents: p.priceCents, quantity: 2 }]).totalCents,
    );
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 2 }], ...base }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.orderId).toBeTruthy();
    expect(data.emailSent).toBe(true);
    expect(verifyPaystackTransaction).toHaveBeenCalledWith("ref_test_123");
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      "buyer@example.com",
      expect.objectContaining({
        id: data.orderId,
        paystackReference: "ref_test_123",
      }),
    );
  });

  it("400s and creates nothing when Paystack reports the payment wasn't successful", async () => {
    session("buyer@example.com");
    const p = await firstProduct();
    vi.mocked(verifyPaystackTransaction).mockResolvedValue({
      success: false,
      amountMinor: 0,
      currency: "NGN",
    });
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 1 }], ...base }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/payment verification failed/);
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("400s when the verified payment amount doesn't match the order total (even if Paystack says success)", async () => {
    session("buyer@example.com");
    const p = await firstProduct();
    paidSuccessfully(1); // way too little
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 1 }], ...base }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/does not match/);
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("400s when the verified payment currency doesn't match the shop's configured currency", async () => {
    session("buyer@example.com");
    const p = await firstProduct();
    const totalForQty1 = computeTotals([
      { priceCents: p.priceCents, quantity: 1 },
    ]).totalCents;
    paidSuccessfully(totalForQty1, "NGN"); // wrong currency vs. the shop's configured USD
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 1 }], ...base }),
    );
    expect(res.status).toBe(400);
  });

  it("validates the cart before ever calling Paystack: 400s for an unknown product, insufficient stock, empty cart, or malformed JSON", async () => {
    session("buyer@example.com");
    const p = await firstProduct();
    expect(
      (
        await checkout(
          req({ items: [{ productId: "nope", quantity: 1 }], ...base }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await checkout(
          req({ items: [{ productId: p.id, quantity: 99 }], ...base }),
        )
      ).status,
    ).toBe(400);
    expect((await checkout(req({ items: [], ...base }))).status).toBe(400);
    expect((await checkout(req(undefined, "{bad"))).status).toBe(400);
    expect(verifyPaystackTransaction).not.toHaveBeenCalled();
  });

  it("still returns 201 if the confirmation email fails to send", async () => {
    session("buyer@example.com");
    vi.mocked(sendOrderConfirmationEmail).mockRejectedValueOnce(
      new Error("Brevo down"),
    );
    const p = await firstProduct();
    const totalForQty1 = computeTotals([
      { priceCents: p.priceCents, quantity: 1 },
    ]).totalCents;
    paidSuccessfully(totalForQty1);
    const res = await checkout(
      req({ items: [{ productId: p.id, quantity: 1 }], ...base }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).emailSent).toBe(false);
  });

  it("returns a JSON 500 when the repo throws after auth/validation pass", async () => {
    session("buyer@example.com");
    setRepo({
      getProductsByIds: async () => {
        throw new Error("db down");
      },
    } as any);
    const res = await checkout(
      req({ items: [{ productId: "x", quantity: 1 }], ...base }),
    );
    expect(res.status).toBe(500);
  });
});
