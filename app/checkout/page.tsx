"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Container from "@/components/common/Container";
import { useCart } from "@/lib/cartContext";
import { computeTotals, formatCents } from "@/lib/cart";
import { CURRENCY } from "@/lib/currency";
import type { Shipping } from "@/lib/types";

const EMPTY: Shipping = { name: "", address: "", city: "", state: "", postalCode: "", country: "Nigeria", phone: "" };

function Field({ label, value, onChange, half = false, type = "text" }: { label: string; value: string; onChange: (v: string) => void; half?: boolean; type?: string }) {
  return (
    <div className={`min-w-0 ${half ? "" : "sm:col-span-2"}`}>
      <label className="block text-[13px] font-bold mb-2 text-black/70">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required type={type} maxLength={200}
        className="w-full border border-[#cfcfcf] rounded px-4 py-3.5 text-sm outline-none focus:border-[#D87D4A] transition-colors box-border" />
    </div>
  );
}
const SectionLabel = ({ text }: { text: string }) => <p className="text-[#D87D4A] text-[13px] font-bold uppercase tracking-wide mb-5 mt-8">{text}</p>;

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shipping, setShipping] = useState<Shipping>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const totals = computeTotals(items);

  if (items.length === 0) {
    return <div className="bg-[#f2f2f2] min-h-screen py-20"><Container><p className="text-center text-black/50">Your cart is empty. <Link href="/" className="text-[#D87D4A] underline">Continue shopping</Link></p></Container></div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="bg-[#f2f2f2] min-h-screen py-20">
        <Container>
          <div className="bg-white rounded-xl p-12 max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold uppercase mb-4">Sign in to checkout</h1>
            <p className="text-black/50 mb-8">We need your Google account so we can send your order confirmation.</p>
            <button onClick={() => signIn("google", { callbackUrl: "/checkout" })} className="bg-[#D87D4A] text-white px-8 py-4 font-bold text-[13px] uppercase tracking-wide hover:bg-[#FBAF85] transition-colors">
              Sign in with Google
            </button>
          </div>
        </Container>
      </div>
    );
  }

  const finalizeOrder = async (paystackReference: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), shipping, paystackReference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      clear();
      router.push(`/order/${data.orderId}?email=${data.emailSent ? "sent" : "failed"}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const payWithPaystack = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formRef.current?.reportValidity()) return;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) { setError("Payments aren't configured yet — add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY."); return; }
    if (!window.PaystackPop) { setError("Payment script hasn't loaded yet — try again in a moment."); return; }

    setSubmitting(true);
    const popup = new window.PaystackPop();
    popup.newTransaction({
      key: publicKey,
      email: session!.user!.email!,
      amount: totals.totalCents,
      currency: CURRENCY,
      reference: `hng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      onSuccess: (transaction) => { void finalizeOrder(transaction.reference); },
      onCancel: () => setSubmitting(false),
      onError: (err) => { setError(err.message || "Payment failed — please try again."); setSubmitting(false); },
    });
  };

  const shortName = (name: string) => name.replace(/Headphones|Speaker|Earphones/g, "").replace("Mark II", "MK II").replace("Mark I", "MK I").trim();

  return (
    <div className="bg-[#f2f2f2] min-h-screen pt-8 pb-20">
      <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
      <Container>
        <div className="flex items-center gap-2 text-sm text-black/50 mb-6">
          <Link href="/" className="hover:text-[#D87D4A]">Home</Link><span>›</span><span className="text-[#D87D4A]">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] gap-7 items-start">
          <form ref={formRef} className="min-w-0 bg-white rounded-xl p-6 sm:p-10 lg:p-12">
            <h1 className="text-[32px] font-bold uppercase tracking-wide mb-9">Checkout</h1>

            <SectionLabel text="Billing Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Name" value={shipping.name} onChange={(v) => setShipping((s) => ({ ...s, name: v }))} half />
              <Field label="Phone Number" value={shipping.phone} onChange={(v) => setShipping((s) => ({ ...s, phone: v }))} half type="tel" />
            </div>

            <SectionLabel text="Shipping Info" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Address" value={shipping.address} onChange={(v) => setShipping((s) => ({ ...s, address: v }))} />
              <Field label="ZIP Code" value={shipping.postalCode} onChange={(v) => setShipping((s) => ({ ...s, postalCode: v }))} half />
              <Field label="City" value={shipping.city} onChange={(v) => setShipping((s) => ({ ...s, city: v }))} half />
              <Field label="State / Region" value={shipping.state} onChange={(v) => setShipping((s) => ({ ...s, state: v }))} half />
              <Field label="Country" value={shipping.country} onChange={(v) => setShipping((s) => ({ ...s, country: v }))} half />
            </div>

            <SectionLabel text="Payment" />
            <p className="text-sm text-black/50">Secured by Paystack. You&apos;ll enter your card details in the next step.</p>
          </form>

          <div className="w-full bg-white rounded-xl p-6 sm:p-9">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-7">Summary</h2>
            <div className="flex flex-col gap-5 mb-7">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F1F1F1] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image src={item.image} alt={item.name} width={36} height={36} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm uppercase">{shortName(item.name)}</p>
                    <p className="text-[13px] text-black/50">{formatCents(item.priceCents)}</p>
                  </div>
                  <span className="text-black/50 font-bold text-sm">x{item.quantity}</span>
                </div>
              ))}
            </div>

            {[["Total", totals.subtotalCents], ["Shipping", totals.shippingCents], ["VAT (Included)", totals.vatCents]].map(([label, value]) => (
              <div key={label as string} className="flex justify-between mb-2.5">
                <span className="text-black/50 uppercase text-sm">{label}</span>
                <span className="font-bold text-[15px]">{formatCents(value as number)}</span>
              </div>
            ))}
            <div className="flex justify-between mt-2 mb-7 pt-2 border-t border-[#f0f0f0]">
              <span className="text-black/50 uppercase text-sm">Grand Total</span>
              <span className="font-bold text-lg text-[#D87D4A]">{formatCents(totals.totalCents)}</span>
            </div>

            {error && <p role="alert" className="text-[#D87D4A] bg-[#D87D4A]/10 border border-[#D87D4A] rounded p-3 text-sm mb-4">{error}</p>}
            <button onClick={payWithPaystack} disabled={submitting}
              className="w-full bg-[#D87D4A] text-white py-4 font-bold text-[13px] uppercase tracking-wide hover:bg-[#FBAF85] transition-colors disabled:opacity-60">
              {submitting ? "Processing…" : `Pay ${formatCents(totals.totalCents)} with Paystack`}
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
