"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import { computeTotals, formatCents } from "@/lib/cart";
import CartItem from "./CartItem";

export default function CartModal() {
  const { items, clear, count, setIsOpen } = useCart();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const totals = computeTotals(items);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setIsOpen]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setIsOpen(false)} />
      <div ref={ref} className="fixed top-[90px] right-[max(calc(50%-555px),24px)] w-[380px] max-h-[calc(100vh-120px)] bg-white rounded-xl p-8 z-[101] shadow-[0_40px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-7">
          <h2 className="font-bold uppercase text-lg tracking-wide">Cart ({count})</h2>
          {items.length > 0 && <button onClick={clear} className="text-sm text-black/50 underline">Remove all</button>}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {items.length === 0 ? (
            <p className="text-black/50 text-center py-14">Your cart is empty.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => <CartItem key={item.productId} item={item} />)}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="uppercase text-sm text-black/50">Total</span>
              <span className="font-bold text-lg">{formatCents(totals.subtotalCents)}</span>
            </div>
            <button onClick={() => { setIsOpen(false); router.push("/checkout"); }}
              className="w-full bg-[#D87D4A] text-white py-4 font-bold text-[13px] uppercase tracking-wide hover:bg-[#FBAF85] transition-colors">
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
