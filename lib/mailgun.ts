import type { Order } from "./types";
import { formatCents } from "./cart";

function renderOrderEmail(order: Order): { html: string; text: string } {
  const rows = order.items.map((i) => `${i.quantity} × ${i.name} — ${formatCents(i.priceCents * i.quantity)}`);
  const text = [
    `Thanks for your order! #${order.id.slice(0, 8)}`, "",
    ...rows, "",
    `Subtotal: ${formatCents(order.subtotalCents)}`,
    `Shipping: ${order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}`,
    `Total: ${formatCents(order.totalCents)}`, "",
    `Shipping to: ${order.shipping.name}, ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}, ${order.shipping.country}`,
  ].join("\n");
  const html = `<h2>Thanks for your order!</h2><p>Order #${order.id.slice(0, 8)}</p>
    <ul>${order.items.map((i) => `<li>${i.quantity} × ${i.name} — ${formatCents(i.priceCents * i.quantity)}</li>`).join("")}</ul>
    <p>Subtotal: ${formatCents(order.subtotalCents)}<br/>Shipping: ${order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}<br/><strong>Total: ${formatCents(order.totalCents)}</strong></p>
    <p>Shipping to:<br/>${order.shipping.name}<br/>${order.shipping.address}<br/>${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}<br/>${order.shipping.country}</p>`;
  return { html, text };
}

/** Best-effort: callers should catch and log rather than fail checkout if this throws. */
export async function sendOrderConfirmationEmail(to: string, order: Order): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) {
    console.warn("Mailgun not configured (MAILGUN_API_KEY/MAILGUN_DOMAIN) — skipping confirmation email");
    return;
  }
  const from = process.env.MAILGUN_FROM ?? `Shop <no-reply@${domain}>`;
  const { html, text } = renderOrderEmail(order);
  const body = new URLSearchParams({ from, to, subject: `Order confirmed — #${order.id.slice(0, 8)}`, html, text });

  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`Mailgun request failed: ${res.status} ${await res.text().catch(() => "")}`);
}
