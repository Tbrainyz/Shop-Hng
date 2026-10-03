import { NextResponse, type NextRequest } from "next/server";
import { computeTotals } from "@/lib/cart";
import { CURRENCY } from "@/lib/currency";
import { getRepo } from "@/lib/db";
import { getUser } from "@/lib/getUser";
import { badRequest, handle, unauthorized } from "@/lib/http";
import { sendOrderConfirmationEmail } from "@/lib/brevo";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { checkoutSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest) => {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success)
    return badRequest(
      parsed.error.issues[0]?.message ?? "invalid checkout request",
    );

  const repo = await getRepo();
  const products = await repo.getProductsByIds(
    parsed.data.items.map((i) => i.productId),
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  if (!process.env.PAYSTACK_SECRET_KEY)
    return badRequest(
      "Payments aren't configured on the server yet — set PAYSTACK_SECRET_KEY.",
    );

  for (const item of parsed.data.items) {
    const p = byId.get(item.productId);
    if (!p) return badRequest(`unknown product: ${item.productId}`);
    if (item.quantity > p.stock)
      return badRequest(`not enough stock for "${p.name}" (${p.stock} left)`);
  }

  // Prices are taken from the database, never trusted from the client.
  const lineItems = parsed.data.items.map((i) => {
    const p = byId.get(i.productId)!;
    return {
      productId: p.id,
      name: p.name,
      priceCents: p.priceCents,
      quantity: i.quantity,
    };
  });
  const totals = computeTotals(lineItems);

  // The charge already happened client-side via the Paystack popup; confirm it really
  // succeeded and paid the right amount before we treat the order as paid.
  const verification = await verifyPaystackTransaction(
    parsed.data.paystackReference,
  );
  if (!verification.success) return badRequest("payment verification failed");
  if (
    verification.amountMinor !== totals.totalCents ||
    verification.currency !== CURRENCY
  ) {
    return badRequest("payment amount does not match the order total");
  }

  const order = await repo.createOrder({
    userId: user.id,
    userEmail: user.email,
    paystackReference: parsed.data.paystackReference,
    items: lineItems,
    shipping: parsed.data.shipping,
    ...totals,
  });

  // The cart is now an order: empty the shared cart so the website and the app both show it empty.
  try {
    await repo.setCart(user.id, []);
  } catch (e) {
    console.error("failed to clear cart after order:", e);
  }

  let emailSent = true;
  try {
    await sendOrderConfirmationEmail(user.email, order);
  } catch (e) {
    console.error("order confirmation email failed:", e);
    emailSent = false;
  }

  return NextResponse.json(
    { orderId: order.id, totalCents: order.totalCents, emailSent },
    { status: 201 },
  );
});
