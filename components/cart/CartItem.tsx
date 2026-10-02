"use client";
import Image from "next/image";
import { useCart, type CartItem as CartItemType } from "@/lib/cartContext";
import { formatCents } from "@/lib/cart";

const shorten = (name: string) => name.replace(/Headphones|Speaker|Earphones/g, "").replace("Mark II", "MK II").replace("Mark I", "MK I").trim();

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity } = useCart();
  return (
    <div className="flex items-center gap-4 pb-4">
      <div className="w-12 h-12 bg-[#F1F1F1] rounded-lg flex-shrink-0 flex items-center justify-center">
        <Image src={item.image} alt={item.name} width={36} height={36} className="object-contain" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm uppercase">{shorten(item.name)}</p>
        <p className="text-[13px] text-black/50 mt-0.5">{formatCents(item.priceCents)}</p>
      </div>
      <div className="flex items-center bg-[#F1F1F1]">
        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 font-bold text-black/35 hover:text-[#D87D4A]" aria-label={`Decrease ${item.name} quantity`}>−</button>
        <span className="w-7 h-7 flex items-center justify-center text-[13px] font-bold">{item.quantity}</span>
        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-7 h-7 font-bold text-black/35 hover:text-[#D87D4A]" aria-label={`Increase ${item.name} quantity`}>+</button>
      </div>
    </div>
  );
}
