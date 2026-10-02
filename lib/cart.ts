import { CURRENCY, formatMoney } from "./currency";

/**
 * Shared by the cart/checkout pages (display) and the checkout route (server-side
 * recompute from real prices). Ported from the original site's checkout: shipping
 * is 10% of the subtotal, VAT is 3.33% of the subtotal shown for transparency but
 * already treated as included in the price — it does not add to the total charged.
 */
const SHIPPING_RATE = 0.1;
const VAT_RATE = 0.0333;

export function computeTotals(items: { priceCents: number; quantity: number }[]) {
  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const shippingCents = items.length === 0 ? 0 : Math.round(subtotalCents * SHIPPING_RATE);
  const vatCents = Math.round(subtotalCents * VAT_RATE);
  return { subtotalCents, shippingCents, vatCents, totalCents: subtotalCents + shippingCents };
}

// Re-exported so existing call sites (`formatCents`) keep working; prefer formatMoney for new code.
export const formatCents = (cents: number) => formatMoney(cents, CURRENCY);
