/**
 * Real catalog ported from the uploaded Audiophile-style frontend. Used by the
 * in-memory dev store and prisma/seed.ts, so dev and production start the same.
 */
export const CATEGORY_ORDER = ["headphones", "speakers", "earphones"];
export const CATEGORY_LABEL: Record<string, string> = { headphones: "Headphones", speakers: "Speakers", earphones: "Earphones" };

interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  category: string;
  stock: number;
  priceUSD: number; // cents
  priceNGN: number; // kobo
  image: string;
  gallery: string[];
  features: string;
  includes: { quantity: number; item: string }[];
  related: string[]; // slugs
  isNew: boolean;
  featured: boolean;
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "xx99-mark-ii-headphones", name: "XX99 Mark II Headphones", category: "headphones", stock: 25,
    description: "Experience natural, lifelike audio and exceptional build quality.",   
    priceUSD: 9900, priceNGN: 158400,
    image: "/assets/headphones/headphone1.svg",
    gallery: ["/assets/headphones/BitmapA.png", "/assets/headphones/BitmapB.png", "/assets/headphones/BitmapC.png"],
    features: "Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for long listening sessions. It includes intuitive controls designed for any situation.",
    includes: [{ quantity: 1, item: "Headphone Unit" }, { quantity: 2, item: "Replacement Earcups" }, { quantity: 1, item: "User Manual" }, { quantity: 1, item: "3.5mm Audio Cable" }],
    related: ["xx99-mark-i-headphones", "xx59-headphones", "zx9-speaker"], isNew: true, featured: true,
  },
  {
    slug: "xx99-mark-i-headphones", name: "XX99 Mark I Headphones", category: "headphones", stock: 18,
    description: "As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction.",
    priceUSD: 8900, priceNGN: 142400,
    image: "/assets/headphones/headphone2.svg",
    gallery: ["/assets/headphones/BitmapD.png", "/assets/headphones/BitmapE.png", "/assets/headphones/BitmapF.png"],
    features: "The XX99 Mark I headphones have been crafted with premium materials and precision engineering to ensure a natural listening experience.",
    includes: [{ quantity: 1, item: "Headphone Unit" }, { quantity: 2, item: "Replacement Earcups" }, { quantity: 1, item: "User Manual" }],
    related: ["xx99-mark-ii-headphones", "xx59-headphones", "zx7-speaker"], isNew: false, featured: false,
  },
  {
    slug: "xx59-headphones", name: "XX59 Headphones", category: "headphones", stock: 40,
    description: "Enjoy your audio almost anywhere and customize it to your liking.",
    priceUSD: 6500, priceNGN: 104000,
    image: "/assets/headphones/headphone3.svg",
    gallery: ["/assets/headphones/BitmapG.png", "/assets/headphones/BitmapH.png", "/assets/headphones/BitmapI.png"],
    features: "These headphones are compact yet powerful, delivering balanced sound and portability for users on the move.",
    includes: [{ quantity: 1, item: "Headphone Unit" }, { quantity: 1, item: "Travel Bag" }, { quantity: 1, item: "User Manual" }],
    related: ["xx99-mark-ii-headphones", "xx99-mark-i-headphones", "yx1-earphones"], isNew: false, featured: false,
  },
  {
    slug: "zx7-speaker", name: "ZX7 Speaker", category: "speakers", stock: 15,
    description: "Stream high quality sound wirelessly with minimal loss.",
    priceUSD: 10900, priceNGN: 174400,
    image: "/assets/speakers/speaker1.svg",
    gallery: ["/assets/speakers/BitmapM.png", "/assets/speakers/BitmapN.png", "/assets/speakers/spec.png"],
    features: "The ZX7 speaker combines sleek design with powerful acoustic performance to create immersive sound experiences.",
    includes: [{ quantity: 2, item: "Speaker Unit" }, { quantity: 2, item: "Speaker Cloth Panel" }, { quantity: 1, item: "User Manual" }],
    related: ["zx9-speaker", "xx99-mark-ii-headphones", "yx1-earphones"], isNew: false, featured: true,
  },
  {
    slug: "yx1-earphones", name: "YX1 Earphones", category: "earphones", stock: 50,
    description: "Tailor your listening experience with bespoke dynamic drivers.",
    priceUSD: 4900, priceNGN: 78400,
    image: "/assets/earphones/earphone.svg",
    gallery: ["/assets/earphones/Bitmap.svg", "/assets/earphones/BitmapP.png", "/assets/earphones/BitmapQ.png"],
    features: "The YX1 earphones feature active noise cancellation and excellent sound isolation for immersive listening anywhere.",
    includes: [{ quantity: 2, item: "Earphone Unit" }, { quantity: 6, item: "Multi-size Earplugs" }, { quantity: 1, item: "Charging Case" }, { quantity: 1, item: "USB-C Cable" }],
    related: ["xx99-mark-ii-headphones", "xx59-headphones", "zx7-speaker"], isNew: false, featured: true,
  },
  {
    slug: "zx9-speaker", name: "ZX9 Speaker", category: "speakers", stock: 12,
    description: "Upgrade your sound system with the all new ZX9 active speaker.",
    priceUSD: 13900, priceNGN: 222400,
    image: "/assets/speakers/speaker2.svg",
    gallery: ["/assets/speakers/BitmapJ.png", "/assets/speakers/BitmapK.png", "/assets/speakers/BitmapL.png"],
    features: "Connect via Bluetooth or nearly any wired source. The ZX9 speaker system delivers room-filling sound with remarkable clarity.",
    includes: [{ quantity: 2, item: "Speaker Unit" }, { quantity: 2, item: "Speaker Cloth Panel" }, { quantity: 1, item: "User Manual" }, { quantity: 1, item: "Remote Control" }],
    related: ["zx7-speaker", "xx99-mark-ii-headphones", "yx1-earphones"], isNew: true, featured: true,
  },
];

export function getSeedProducts(currency: "NGN" | "USD") {
  return PRODUCTS.map(({ priceUSD, priceNGN, ...rest }) => ({ ...rest, priceCents: currency === "NGN" ? priceNGN : priceUSD }));
}
