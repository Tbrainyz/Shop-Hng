import { PrismaClient } from "@prisma/client";
import { CURRENCY } from "../lib/currency";
import { getSeedProducts } from "../lib/seedProducts";

const prisma = new PrismaClient();

async function main() {
  const products = getSeedProducts(CURRENCY);
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) await prisma.product.create({ data: p });
  }
  console.log(`Seeded ${products.length} products in ${CURRENCY} (skipped any that already existed).`);
}

main().finally(() => prisma.$disconnect());
