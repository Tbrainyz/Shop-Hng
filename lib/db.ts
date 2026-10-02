import { MemoryOrderRepo } from "./memoryRepo";
import type { OrderRepo } from "./repo";

const g = globalThis as unknown as { __shopRepo?: OrderRepo };

/** Tests inject a repo here. */
export function setRepo(repo: OrderRepo | undefined) { g.__shopRepo = repo; }

export async function getRepo(): Promise<OrderRepo> {
  if (g.__shopRepo) return g.__shopRepo;
  const url = process.env.DATABASE_URL;
  if (url) {
    const { PrismaOrderRepo } = await import("./prismaRepo");
    g.__shopRepo = new PrismaOrderRepo();
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  } else {
    console.warn("DATABASE_URL not set: using an in-memory product/order store (data is lost on restart)");
    g.__shopRepo = new MemoryOrderRepo();
  }
  return g.__shopRepo;
}
