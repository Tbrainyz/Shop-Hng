import { describe, expect, it } from "vitest";
import { mergeCarts, sameCart } from "@/lib/cartMerge";

const L = (productId: string, quantity: number) => ({ productId, quantity });

describe("sameCart", () => {
  it("ignores order, compares quantities", () => {
    expect(sameCart([L("a", 1), L("b", 2)], [L("b", 2), L("a", 1)])).toBe(true);
    expect(sameCart([L("a", 1)], [L("a", 2)])).toBe(false);
    expect(sameCart([L("a", 1)], [L("a", 1), L("b", 1)])).toBe(false);
    expect(sameCart([], [])).toBe(true);
  });
});

describe("mergeCarts (guest cart + saved cart at sign-in)", () => {
  it("adds quantities for the same product and appends new ones", () => {
    expect(mergeCarts([L("a", 1), L("b", 1)], [L("b", 2), L("c", 5)])).toEqual([L("a", 1), L("b", 3), L("c", 5)]);
  });
  it("caps quantity at 99", () => {
    expect(mergeCarts([L("a", 90)], [L("a", 20)])).toEqual([L("a", 99)]);
  });
  it("doesn't mutate its inputs", () => {
    const server = [L("a", 1)]; const guest = [L("a", 1)];
    mergeCarts(server, guest);
    expect(server).toEqual([L("a", 1)]);
    expect(guest).toEqual([L("a", 1)]);
  });
});
