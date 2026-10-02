import Image from "next/image";
import Link from "next/link";
import { getRepo } from "@/lib/db";
import Container from "@/components/common/Container";
import ProductFeatures from "@/components/product/ProductFeatures";
import ProductGallery from "@/components/product/ProductGallery";
import RelatedProducts from "@/components/product/RelatedProducts";
import AddToCart from "@/components/product/AddToCart";
import Categories from "@/components/home/Categories";
import BestGear from "@/components/home/BestGear";
import { formatCents } from "@/lib/cart";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await (await getRepo()).listProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return <div className="py-40 text-center"><p className="text-black/50">Product not found.</p></div>;
  }
  const related = product.related.map((s) => products.find((p) => p.slug === s)).filter((p): p is typeof product => !!p);

  return (
    <>
      <div className="bg-white">
        <Container>
          <nav className="pt-8">
            <div className="flex items-center gap-2 text-sm text-black/50">
              <Link href={`/category/${product.category}`} className="capitalize hover:text-[#D87D4A] transition-colors">{product.category}</Link>
              <span>&gt;</span>
              <span className="text-black/80">{product.name}</span>
            </div>
          </nav>

          <div className="flex flex-wrap gap-20 items-center pt-12">
            <div className="flex-[1_1_340px] bg-[#F1F1F1] rounded-xl flex items-center justify-center min-h-[420px] p-10">
              <Image src={product.image} alt={product.name} width={300} height={300} style={{ maxWidth: 300, width: "100%", height: "auto" }} />
            </div>

            <div className="flex-[1_1_300px]">
              {product.isNew && <p className="uppercase tracking-[10px] text-[#D87D4A] text-[13px] mb-4">New Product</p>}
              <h1 className="text-4xl font-bold uppercase leading-tight mb-6 max-w-[280px]">{product.name}</h1>
              <p className="text-black/50 leading-[1.875] mb-8 max-w-[440px] text-[15px]">{product.description}</p>
              <p className="text-lg font-bold tracking-wide mb-10">{formatCents(product.priceCents)}</p>
              <AddToCart product={product} />
            </div>
          </div>

          <ProductFeatures features={product.features} includes={product.includes} />
          <div className="mb-20"><ProductGallery gallery={product.gallery} name={product.name} /></div>
          <RelatedProducts products={related} />
        </Container>
      </div>

      <Categories />
      <BestGear />
    </>
  );
}
