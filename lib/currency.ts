/**
 * Single active currency for the whole shop, not a live multi-currency toggle —
 * Paystack charges in one currency per transaction anyway. Defaults to USD; set
 * NEXT_PUBLIC_CURRENCY=NGN to switch to Naira. Re-seed after switching (lib/seedProducts.ts
 * has per-currency prices) since amounts don't auto-convert.
 */
export const CURRENCY: "NGN" | "USD" = process.env.NEXT_PUBLIC_CURRENCY === "NGN" ? "NGN" : "USD";

export function formatMoney(minorUnits: number, currency: string = CURRENCY): string {
  const locale = currency === "NGN" ? "en-NG" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minorUnits / 100);
  } catch {
    return `${currency} ${(minorUnits / 100).toFixed(2)}`;
  }
}
