import Stripe from "stripe";
import OrderModel from "../models/orderModel";
import { CheckoutItem } from "../types/stripe"; // Define this type
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createPaymentWithToken = async (
  userId: string,
  token: string,
  items: CheckoutItem[],
  shippingAddress: string
): Promise<{ charge: Stripe.Charge; orderId: string }> => {
  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Create an order in your database
  const order = await OrderModel.create({
    user: userId,
    items: items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount,
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "stripe",
    shippingAddress,
    currency: "usd",
  });

  try {
    // Create a charge using the token
    const charge = await stripe.charges.create({
      amount: Math.round(totalAmount * 100), // Stripe uses cents, ensure it's an integer
      currency: "usd",
      source: token,
      description: `Charge for order ${order.id}`,
      metadata: {
        orderId: order.id,
      },
    });

    // Update order with payment details
    await OrderModel.findByIdAndUpdate(order.id, {
      status: "paid",
      paymentStatus: "paid",
      "paymentDetails.stripeChargeId": charge.id,
    });

    return { charge, orderId: order.id };
  } catch (error) {
    // If charge creation fails, update the order status
    await OrderModel.findByIdAndUpdate(order.id, {
      status: "failed",
      paymentStatus: "failed",
    });
    throw error;
  }
};

// Add other Stripe-related service functions here
