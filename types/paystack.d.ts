export {};

/** Paystack InlineJS v2 — https://js.paystack.co/v2/inline.js */
interface PaystackTransaction { reference: string; status: string; message: string }
interface PaystackTransactionOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  reference?: string;
  onSuccess: (transaction: PaystackTransaction) => void;
  onLoad?: (response: unknown) => void;
  onCancel?: () => void;
  onError?: (error: { message: string }) => void;
}

declare global {
  interface Window {
    PaystackPop?: new () => { newTransaction: (options: PaystackTransactionOptions) => void };
  }
}
