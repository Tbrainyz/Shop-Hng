import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validate";

const shipping = { name: "A", address: "1 Main St", city: "Lagos", state: "Lagos", postalCode: "100001", country: "Nigeria", phone: "+2340000000000" };
const valid = { items: [{ productId: "p1", quantity: 2 }], shipping, paystackReference: "ref_test_123" };

describe("checkoutSchema", () => {
  it("accepts a valid checkout request", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects an empty cart", () => {
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });
  it.each([
    [{ productId: "", quantity: 1 }], [{ productId: "p1", quantity: 0 }],
    [{ productId: "p1", quantity: -1 }], [{ productId: "p1", quantity: 1.5 }], [{ productId: "p1", quantity: 100 }],
  ])("rejects an invalid item %o", (item) => {
    expect(checkoutSchema.safeParse({ ...valid, items: [item] }).success).toBe(false);
  });
  it.each(["name", "address", "city", "state", "postalCode", "country", "phone"] as const)(
    "rejects shipping with an empty %s", (field) => {
      expect(checkoutSchema.safeParse({ ...valid, shipping: { ...shipping, [field]: "  " } }).success).toBe(false);
    },
  );
  it("rejects a missing body shape", () => {
    expect(checkoutSchema.safeParse(null).success).toBe(false);
    expect(checkoutSchema.safeParse({}).success).toBe(false);
  });
});

describe("checkoutSchema paystackReference", () => {
  it("rejects a missing or empty payment reference", () => {
    const { paystackReference, ...rest } = valid as any;
    expect(checkoutSchema.safeParse(rest).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, paystackReference: "" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, paystackReference: "   " }).success).toBe(false);
  });
});
