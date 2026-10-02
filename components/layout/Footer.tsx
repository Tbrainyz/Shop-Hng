import Image from "next/image";
import Link from "next/link";
import Container from "../common/Container";

export default function Footer() {
  return (
    <footer className="bg-[#191919] text-white pt-20 pb-[60px] border-t-4 border-[#D87D4A]">
      <Container>
        <div className="pt-5">
          <div className="bg-[#D87D4A] w-24 h-1 rounded mb-12" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-[72px]">
            <Image src="/assets/logo.png" alt="Audiophile Logo" width={143} height={25} />
            <ul className="flex flex-col md:flex-row gap-8 md:gap-10 text-sm font-bold uppercase tracking-widest">
              <li><Link href="/" className="hover:text-[#D87D4A] transition-colors">Home</Link></li>
              <li><Link href="/category/headphones" className="hover:text-[#D87D4A] transition-colors">Headphones</Link></li>
              <li><Link href="/category/speakers" className="hover:text-[#D87D4A] transition-colors">Speakers</Link></li>
              <li><Link href="/category/earphones" className="hover:text-[#D87D4A] transition-colors">Earphones</Link></li>
            </ul>
          </div>

          <p className="text-white/60 max-w-[420px] leading-relaxed mb-12">
            Audiophile is an all in one stop to fulfill your audio needs. We&apos;re a small team of music lovers and sound specialists devoted to helping you get the most out of personal audio.
          </p>

          <div className="flex flex-wrap justify-between items-center gap-6 text-white/60 text-sm">
            <p>Copyright 2026. All Rights Reserved. Payments secured by Paystack.</p>
            <div className="flex gap-6">
              <Image src="/assets/face.svg" alt="Facebook" width={24} height={24} className="cursor-pointer" />
              <Image src="/assets/bird.svg" alt="Twitter" width={24} height={24} className="cursor-pointer" />
              <Image src="/assets/insta.svg" alt="Instagram" width={24} height={24} className="cursor-pointer" />
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
