/** Verifies a completed Paystack charge server-side — never trust the client's word that payment succeeded. */
export interface PaystackVerification { success: boolean; amountMinor: number; currency: string }

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerification> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) throw new Error(`Paystack verify request failed: ${res.status}`);

  const data = body.data ?? {};
  return { success: body.status === true && data.status === "success", amountMinor: data.amount ?? 0, currency: data.currency ?? "" };
}
