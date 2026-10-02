import Image from "next/image";
import Link from "next/link";
import Button from "../common/Button";
import Container from "../common/Container";
import type { Product } from "@/lib/types";

export default function FeaturedProducts({ zx9, zx7, yx1 }: { zx9?: Product; zx7?: Product; yx1?: Product }) {
  if (!zx9 || !zx7 || !yx1) return null;
  return (
    <section className="pb-12">
      <Container>
        <div className="flex flex-col gap-6">
          <div className="rounded-xl overflow-hidden relative bg-[#D87D4A] min-h-[480px]">
            <div className="absolute rounded-full border border-white/20 pointer-events-none" style={{ width: 600, height: 600, top: -180, left: -120 }} />
            <div className="absolute rounded-full border border-white/15 pointer-events-none" style={{ width: 420, height: 420, top: -90, left: -30 }} />
            <div className="relative flex flex-col lg:flex-row items-end justify-between h-full min-h-[480px]">
              <div className="flex justify-center lg:justify-start lg:self-end pl-16">
                <Image src={zx9.image} alt={zx9.name} width={280} height={280} className="block" />
              </div>
              <div className="text-center lg:text-left text-white self-center flex-1 pr-20 pl-8 pb-16 pt-8 max-w-[340px] mx-auto lg:mx-0">
                <h2 className="font-bold uppercase text-white mb-5" style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05 }}>{zx9.name}</h2>
                <p className="text-white/75 leading-relaxed mb-8 text-[15px]">{zx9.description}</p>
                <Link href={`/product/${zx9.slug}`}><Button text="See Product" variant="dark" /></Link>
              </div>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden h-[320px]">
            <Image src="/assets/speakers/spec.png" alt="" fill className="object-cover" />
            <div className="absolute inset-0 flex items-center pl-[60px]">
              <div>
                <h2 className="font-bold uppercase mb-8 text-[28px]">{zx7.name}</h2>
                <Link href={`/product/${zx7.slug}`}><Button text="See Product" variant="outline" /></Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden min-h-[300px] relative">
              <Image src={yx1.gallery[1] ?? yx1.image} alt={yx1.name} fill className="object-cover" />
            </div>
            <div className="bg-[#F1F1F1] rounded-xl flex flex-col justify-center px-10 py-10">
              <h2 className="font-bold uppercase mb-8 text-[28px]">{yx1.name}</h2>
              <Link href={`/product/${yx1.slug}`}><Button text="See Product" variant="outline" /></Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
