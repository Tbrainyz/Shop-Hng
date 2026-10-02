import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRepo } from "@/lib/db";
import { formatCents } from "@/lib/cart";
import Container from "@/components/common/Container";
import Button from "@/components/common/Button";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const emailStatus = query.email;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div className="bg-[#f2f2f2] min-h-screen py-24"><Container><p className="text-center text-black/50">Sign in to view this order.</p></Container></div>;
  }

  const order = await (await getRepo()).getOrder(id, session.user.id ?? session.user.email ?? "");
  if (!order) {
    return <div className="bg-[#f2f2f2] min-h-screen py-24"><Container><p className="text-center text-black/50">Order not found.</p></Container></div>;
  }

  return (
    <div className="bg-[#f2f2f2] min-h-screen py-16">
      <Container>
        <div className="bg-white rounded-xl p-10 sm:p-14 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#D87D4A]/10 flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#D87D4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="text-[28px] font-bold uppercase tracking-wide mb-2">Order confirmed</h1>
          <p className="text-black/50 mb-5">Order #{order.id.slice(0, 8)} is confirmed.</p>
          {emailStatus === "sent" ? (
            <p role="status" className="rounded-lg bg-green-50 text-green-800 px-4 py-3 text-sm mb-10">
              Confirmation email sent to {order.userEmail}. If it doesn&apos;t appear shortly, check your spam folder.
            </p>
          ) : emailStatus === "failed" ? (
            <p role="status" className="rounded-lg bg-[#D87D4A]/10 text-[#8A4828] px-4 py-3 text-sm mb-10">
              Your order is saved, but we couldn&apos;t send the confirmation email to {order.userEmail}. Please contact the shop if you need help.
            </p>
          ) : (
            <p className="text-black/50 mb-10">Order details and delivery information are below.</p>
          )}

          <div className="flex flex-col gap-5 mb-8">
            {order.items.map((i) => (
              <div key={i.productId} className="flex items-center justify-between pb-5 border-b border-black/5 last:border-0">
                <span className="font-bold text-sm uppercase">{i.quantity} × {i.name}</span>
                <span className="font-bold text-sm">{formatCents(i.priceCents * i.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mb-2 text-sm"><span className="text-black/50 uppercase">Subtotal</span><span className="font-bold">{formatCents(order.subtotalCents)}</span></div>
          <div className="flex justify-between mb-2 text-sm"><span className="text-black/50 uppercase">Shipping</span><span className="font-bold">{formatCents(order.shippingCents)}</span></div>
          <div className="flex justify-between mt-2 mb-8 pt-3 border-t border-black/10"><span className="text-black/50 uppercase text-sm">Total</span><span className="font-bold text-lg text-[#D87D4A]">{formatCents(order.totalCents)}</span></div>

          <p className="text-[13px] font-bold uppercase text-black/50 mb-2">Shipping to</p>
          <p className="text-black/70 leading-relaxed mb-10">
            {order.shipping.name}<br />{order.shipping.address}<br />{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}<br />{order.shipping.country}
          </p>

          <Link href="/"><Button text="Back to Home" variant="primary" /></Link>
        </div>
      </Container>
    </div>
  );
}
