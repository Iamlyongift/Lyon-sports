import { Request, Response } from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import OrderModel, { OrderType, IOrderItem } from "../models/orderModel"; // Adjust the import path as needed
import { CheckoutItem } from "../types/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function createCheckoutSession(
  userId: string,
  items: CheckoutItem[],
  shippingAddress: string
) {
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
    shippingAddress,
    currency: "usd", // Or dynamically set based on your application's needs
  });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100, // Stripe uses cents
        product_data: {
          name: item.name,
          description: item.description,
        },
      },
      quantity: item.quantity,
    })
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `https://your-website.com/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://your-website.com/cancel`,
    metadata: {
      orderId: order.id,
    },
  });

  // Update order with Stripe session ID
  await OrderModel.findByIdAndUpdate(order.id, {
    "paymentDetails.stripeSessionId": session.id,
  });

  return { session, orderId: order.id };
}

export async function verifyPayment(orderId: string) {
  try {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    let stripeStatus = "unknown";
    let amount = order.totalAmount;
    let currency = order.currency || "usd"; // Default to USD if not specified

    if (order.paymentDetails?.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.paymentDetails.stripePaymentIntentId
        );

        stripeStatus = paymentIntent.status;
        amount = paymentIntent.amount / 100; // Convert from cents to dollars
        currency = paymentIntent.currency;

        if (paymentIntent.status === "succeeded" && order.status !== "paid") {
          // Update order if Stripe shows it's paid but our DB doesn't
          order.status = "paid";
          order.status = "processing";
          await order.save();
        } else if (paymentIntent.status === "canceled") {
          // Handle canceled payments
          order.status = "canceled";
          await order.save();
        }
      } catch (stripeError) {
        console.error(
          "Error retrieving payment intent from Stripe:",
          stripeError
        );
        // If we can't reach Stripe, we'll return the data we have in our database
      }
    }

    return {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      stripeStatus,
      amount,
      currency,
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await verifyAndUpdatePayment(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "payment_intent.succeeded":
        await confirmPaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    throw error;
  }
}

async function verifyAndUpdatePayment(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    throw new Error("No orderId found in session metadata");
  }

  // Verify the payment status
  if (session.payment_status !== "paid") {
    console.log(
      `Payment not completed for order ${orderId}. Status: ${session.payment_status}`
    );
    return;
  }

  try {
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        orderStatus: "processing", // or whatever status you use after payment
        "paymentDetails.stripeSessionId": session.id,
        "paymentDetails.stripePaymentIntentId":
          session.payment_intent as string,
        "paymentDetails.amountPaid": session.amount_total,
        "paymentDetails.currency": session.currency,
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    console.log(
      `Payment verified and order updated for ${orderId}:`,
      updatedOrder
    );
  } catch (error) {
    console.error(
      `Error updating order ${orderId} after payment verification:`,
      error
    );
    throw error;
  }
}

async function confirmPaymentSuccess(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    console.log("PaymentIntent succeeded but no orderId found in metadata");
    return;
  }

  try {
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        orderStatus: "processing",
        "paymentDetails.stripePaymentIntentId": paymentIntent.id,
        "paymentDetails.amountPaid": paymentIntent.amount,
        "paymentDetails.currency": paymentIntent.currency,
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(
        `Order ${orderId} not found when confirming payment success`
      );
    }

    console.log(
      `Payment success confirmed for order ${orderId}:`,
      updatedOrder
    );
  } catch (error) {
    console.error(
      `Error confirming payment success for order ${orderId}:`,
      error
    );
    throw error;
  }
}

async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    console.log("PaymentIntent failed but no orderId found in metadata");
    return;
  }

  try {
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "failed",
        orderStatus: "payment_failed",
        "paymentDetails.stripePaymentIntentId": paymentIntent.id,
        "paymentDetails.lastErrorMessage":
          paymentIntent.last_payment_error?.message,
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(
        `Order ${orderId} not found when handling payment failure`
      );
    }

    console.log(`Payment failure recorded for order ${orderId}:`, updatedOrder);
  } catch (error) {
    console.error(
      `Error handling payment failure for order ${orderId}:`,
      error
    );
    throw error;
  }
}

export const deliveryWebhook = async (req: Request, res: Response) => {
  try {
    // Extract the webhook secret from the headers
    const receivedSecret = req.headers["authorization"];

    // Compare with your stored webhook secret
    if (receivedSecret !== `Bearer ${process.env.STRIPE_WEBHOOK_SECRET}`) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid webhook secret" });
    }

    const { orderId, status, deliveryDate } = req.body;

    // Ensure the orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    // Convert to ObjectId
    const validOrderId = new mongoose.Types.ObjectId(orderId);

    // Find the order by ID
    const order = await OrderModel.findById(validOrderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status based on webhook data
    if (status === "delivered") {
      order.status = "completed";
      order.deliveryDate = new Date(deliveryDate);
      await order.save();
    }

    res.status(200).json({ message: "Order status updated to completed" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
