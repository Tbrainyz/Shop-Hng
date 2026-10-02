import Image from "next/image";
import Link from "next/link";
import Button from "../common/Button";
import Container from "../common/Container";
import type { Product } from "@/lib/types";

export default function Hero({ product }: { product?: Product }) {
  if (!product) return <div className="bg-[#191919] min-h-[600px]" />;
  return (
    <section className="bg-[#191919] text-white relative overflow-hidden min-h-[600px]">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none left-[45%]">
        <div className="rounded-full border border-white/[0.08] w-[700px] h-[700px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none left-[45%]">
        <div className="rounded-full border border-white/[0.06] w-[500px] h-[500px]" />
      </div>
      <Container>
        <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between min-h-[600px]">
          <div className="flex-1 text-center lg:text-left self-center pt-16 lg:pt-0 pb-8 lg:pb-16">
            <p className="uppercase text-white/50 tracking-[10px] text-sm mb-4">New Product</p>
            <h1 className="font-bold uppercase text-white mb-6" style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.1, maxWidth: 380 }}>{product.name}</h1>
            <p className="text-white/50 leading-relaxed mb-10 max-w-[350px] mx-auto lg:mx-0 text-[15px]">{product.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={`/product/${product.slug}`}><Button text="See Product" variant="primary" /></Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end items-end">
            <Image src={product.image} alt={product.name} width={480} height={480} style={{ width: "100%", maxWidth: 480, height: "auto" }} priority />
          </div>
        </div>
      </Container>
    </section>
  );
}
