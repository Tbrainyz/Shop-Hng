import type { Order } from "./types";
import { formatCents } from "./cart";

function renderOrderEmail(order: Order): { html: string; text: string } {
  const rows = order.items.map(
    (i) =>
      `${i.quantity} × ${i.name} — ${formatCents(i.priceCents * i.quantity)}`,
  );
  const text = [
    `Thanks for your order! #${order.id.slice(0, 8)}`,
    "",
    ...rows,
    "",
    `Subtotal: ${formatCents(order.subtotalCents)}`,
    `Shipping: ${order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}`,
    `Total: ${formatCents(order.totalCents)}`,
    "",
    `Shipping to: ${order.shipping.name}, ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}, ${order.shipping.country}`,
  ].join("\n");
  const html = `<h2>Thanks for your order!</h2><p>Order #${order.id.slice(0, 8)}</p>
    <ul>${order.items.map((i) => `<li>${i.quantity} × ${i.name} — ${formatCents(i.priceCents * i.quantity)}</li>`).join("")}</ul>
    <p>Subtotal: ${formatCents(order.subtotalCents)}<br/>Shipping: ${order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}<br/><strong>Total: ${formatCents(order.totalCents)}</strong></p>
    <p>Shipping to:<br/>${order.shipping.name}<br/>${order.shipping.address}<br/>${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}<br/>${order.shipping.country}</p>`;
  return { html, text };
}

/** Best-effort: callers should catch and log rather than fail checkout if this throws. */
export async function sendOrderConfirmationEmail(
  to: string,
  order: Order,
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_FROM_EMAIL ?? process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.warn(
      "Brevo not configured (BREVO_API_KEY/BREVO_FROM_EMAIL or BREVO_SENDER_EMAIL) — skipping confirmation email",
    );
    return;
  }

  const senderName = process.env.BREVO_FROM_NAME ?? process.env.BREVO_SENDER_NAME ?? "Hng-Shopping";
  const { html, text } = renderOrderEmail(order);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: `Order confirmed — #${order.id.slice(0, 8)}`,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok)
    throw new Error(
      `Brevo request failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
}
