import express from "express";
import {
  createCheckoutSession,
  deliveryWebhook,
  verifyPayment,
} from "../services/paymentServices";
import { createPayment } from "../controllers/payment";

const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;
    const { session, orderId } = await createCheckoutSession(
      userId,
      items,
      shippingAddress
    );
    res.json({ sessionId: session.id, sessionUrl: session.url, orderId });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/verify-payment/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const paymentInfo = await verifyPayment(orderId);
    res.json(paymentInfo);
  } catch (error) {
    console.error("Error in payment verification route:", error);

    if (error instanceof Error) {
      res
        .status(error.message === "Order not found" ? 404 : 500)
        .json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});

router.post("/create-payment", createPayment);

router.post("/delivery-webhook", deliveryWebhook);

export default router;
