import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/common/Container";
import Button from "@/components/common/Button";
import Categories from "@/components/home/Categories";
import BestGear from "@/components/home/BestGear";
import { getRepo } from "@/lib/db";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/seedProducts";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!CATEGORY_ORDER.includes(category)) notFound();

  const products = (await (await getRepo()).listProducts()).filter((p) => p.category === category);

  return (
    <>
      <section className="bg-[#191919] py-24 text-center">
        <h1 className="text-white text-[28px] md:text-[40px] font-bold uppercase tracking-[3px]">{CATEGORY_LABEL[category]}</h1>
      </section>

      <section className="py-20 bg-white">
        <Container>
          <div className="flex flex-col">
            {products.map((product, index) => (
              <div key={product.id} className={`flex flex-col lg:flex-row items-center gap-14 lg:gap-28 py-20 ${index !== products.length - 1 ? "border-b border-black/10" : ""} ${index % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}>
                <div className="flex-1 w-full">
                  <div className="bg-[#F1F1F1] rounded-xl p-12 flex items-center justify-center min-h-[352px]">
                    <Image src={product.image} alt={product.name} width={340} height={280} className="object-contain" style={{ maxWidth: 340, maxHeight: 280, width: "100%", height: "auto" }} />
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  {product.isNew && <p className="uppercase tracking-[10px] text-[#D87D4A] text-sm mb-4">New Product</p>}
                  <h2 className="text-[28px] lg:text-[40px] font-bold uppercase leading-tight mb-6 max-w-[260px] mx-auto lg:mx-0">{product.name}</h2>
                  <p className="text-black/50 leading-[1.875] mb-10 max-w-[445px] mx-auto lg:mx-0">{product.description}</p>
                  <Link href={`/product/${product.slug}`}><Button text="See Product" variant="primary" /></Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Categories />
      <BestGear />
    </>
  );
}
