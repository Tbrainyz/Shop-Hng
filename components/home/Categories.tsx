import Image from "next/image";
import Link from "next/link";
import Container from "../common/Container";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/seedProducts";

const CATEGORY_IMAGE: Record<string, string> = {
  headphones: "/assets/headphones/headphone1.svg",
  speakers: "/assets/speakers/speaker1.svg",
  earphones: "/assets/earphones/earphone.svg",
};

export default function Categories() {
  return (
    <section className="bg-[#fafafa] pt-20 pb-12">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-14">
          {CATEGORY_ORDER.map((slug) => (
            <div key={slug} className="relative pt-16">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[150px] z-10">
                <Image src={CATEGORY_IMAGE[slug]} alt={CATEGORY_LABEL[slug]} width={150} height={150} className="w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)]" />
              </div>
              <Link href={`/category/${slug}`} className="block">
                <div className="bg-[#F1F1F1] rounded-lg text-center pt-[88px] pb-7 px-4 hover:bg-[#e8e8e8] transition-colors">
                  <h3 className="uppercase font-bold tracking-wide text-[15px] mb-3">{CATEGORY_LABEL[slug]}</h3>
                  <span className="inline-flex items-center gap-2 uppercase font-bold text-[13px] text-black/50">
                    Shop
                    <svg width="7" height="11" viewBox="0 0 8 12" fill="none"><path d="M1.5 1l5 5-5 5" stroke="#D87D4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
