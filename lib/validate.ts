import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});

export const shippingSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100),
  address: z.string().trim().min(1, "address is required").max(200),
  city: z.string().trim().min(1, "city is required").max(100),
  state: z.string().trim().min(1, "state is required").max(100),
  postalCode: z.string().trim().min(1, "postal code is required").max(20),
  country: z.string().trim().min(1, "country is required").max(100),
  phone: z.string().trim().min(1, "phone is required").max(30),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "cart is empty").max(50),
  shipping: shippingSchema,
  paystackReference: z.string().trim().min(1, "payment reference is required"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartSchema = z.object({
  items: z.array(checkoutItemSchema).max(50),
});
