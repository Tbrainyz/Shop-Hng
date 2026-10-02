import { describe, expect, it } from "vitest";
import { computeTotals, formatCents } from "@/lib/cart";
import { CURRENCY } from "@/lib/currency";

describe("computeTotals", () => {
  it("returns zero for an empty cart", () => {
    expect(computeTotals([])).toEqual({ subtotalCents: 0, shippingCents: 0, vatCents: 0, totalCents: 0 });
  });
  it("sums price × quantity across multiple items", () => {
    const t = computeTotals([{ priceCents: 1000, quantity: 2 }, { priceCents: 500, quantity: 3 }]);
    expect(t.subtotalCents).toBe(3500);
  });
  it("charges 10% of the subtotal as shipping", () => {
    const t = computeTotals([{ priceCents: 10000, quantity: 1 }]);
    expect(t.shippingCents).toBe(1000);
    expect(t.totalCents).toBe(11000);
  });
  it("shows VAT at 3.33% of the subtotal, but does not add it to the total", () => {
    const t = computeTotals([{ priceCents: 10000, quantity: 1 }]);
    expect(t.vatCents).toBe(Math.round(10000 * 0.0333));
    expect(t.totalCents).toBe(t.subtotalCents + t.shippingCents); // VAT excluded
  });
});

describe("formatCents (NGN by default)", () => {
  it("uses NGN as the active currency", () => {
    expect(CURRENCY).toBe("NGN");
    expect(formatCents(150)).toContain("₦");
  });

  it("formats whole and fractional amounts", () => {
    expect(formatCents(0)).toContain("0.00");
    expect(formatCents(150)).toContain("1.50");
    expect(formatCents(299900)).toContain("2,999.00");
  });
});
