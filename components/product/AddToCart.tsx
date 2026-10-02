"use client";
import { useState } from "react";
import Button from "../common/Button";
import { useCart } from "@/lib/cartContext";
import type { Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { add, setIsOpen } = useCart();
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center bg-[#F1F1F1]">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-12 font-bold text-lg text-black/25 hover:text-[#D87D4A] transition-colors" aria-label="Decrease quantity">−</button>
        <span className="w-10 h-12 flex items-center justify-center font-bold text-sm">{qty}</span>
        <button onClick={() => setQty((q) => q + 1)} className="w-10 h-12 font-bold text-lg text-black/25 hover:text-[#D87D4A] transition-colors" aria-label="Increase quantity">+</button>
      </div>
      <Button text="Add to Cart" variant="primary" onClick={() => { add(product, qty); setIsOpen(true); }} />
    </div>
  );
}
