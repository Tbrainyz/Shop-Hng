import Image from "next/image";
import Container from "../common/Container";

export default function BestGear() {
  return (
    <section className="pt-20 pb-20 bg-white">
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <h2 className="font-bold uppercase leading-tight mb-8" style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}>
              Bringing you the <span className="text-[#D87D4A]">best</span> audio gear
            </h2>
            <p className="text-black/50 leading-relaxed max-w-[540px] mx-auto lg:mx-0 text-[15px]">
              Located at the heart of the city, Hng-Shopping is the premier store for high end headphones, earphones, speakers, and audio accessories. Stop by to meet the team who make this the best place to buy your portable audio equipment.
            </p>
          </div>
          <div className="flex-1 order-1 lg:order-2">
            <Image src="/assets/headphones/BitmapA.png" alt="" width={540} height={588} className="w-full h-auto rounded-xl" />
          </div>
        </div>
      </Container>
    </section>
  );
}
