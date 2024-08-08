// src/types/stripe.ts

export interface CheckoutItem {
  name: string;
  product: string;
  quantity: number;
  price: number;
  description: string;
}
