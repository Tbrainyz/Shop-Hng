import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="py-20">
      <h2 className="text-center text-[28px] font-bold uppercase tracking-wide mb-14">You May Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="text-center">
            <div className="bg-[#F1F1F1] rounded-xl px-6 py-10 mb-8 flex items-center justify-center min-h-[200px]">
              <Image src={product.image} alt={product.name} width={180} height={180} className="object-contain" style={{ maxWidth: 180, width: "100%", height: "auto" }} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-6">{product.name}</h3>
            <Link href={`/product/${product.slug}`}>
              <button className="bg-[#D87D4A] text-white px-7 py-3.5 text-[13px] font-bold uppercase tracking-wide hover:bg-[#FBAF85] transition-colors">See Product</button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
