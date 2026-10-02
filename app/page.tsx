import { getRepo } from "@/lib/db";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BestGear from "@/components/home/BestGear";

export const dynamic = "force-dynamic";

export default async function Page() {
  const products = await (await getRepo()).listProducts();
  const find = (slug: string) => products.find((p) => p.slug === slug);

  return (
    <>
      <Hero product={find("xx99-mark-ii-headphones")} />
      <Categories />
      <FeaturedProducts zx9={find("zx9-speaker")} zx7={find("zx7-speaker")} yx1={find("yx1-earphones")} />
      <BestGear />
    </>
  );
}
