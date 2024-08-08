import { Request, Response } from "express";
import * as stripeService from "../services/stripeService";
import { CheckoutItem } from "../types/stripe";
import nodemailer from "nodemailer";

export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, token, items, shippingAddress, email } = req.body as {
      userId: string;
      token: string;
      items: CheckoutItem[];
      shippingAddress: string;
      email: string;
    };

    const result = await stripeService.createPaymentWithToken(
      userId,
      token,
      items,
      shippingAddress
    );

    // Send email to the user
    const transporter = nodemailer.createTransport({
      // Configure your email transport settings here
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "31fcae5b162f4a",
        pass: "01824d868af815",
      },
    });

    const mailOptions = {
      from: "your_email@example.com",
      to: email, // Use the email from the request body
      subject: "Payment Successful",
      text: `Thank you for your payment! Your order has been processed.`,
    };

    await transporter.sendMail(mailOptions);

    res.json(result);
  } catch (error) {
    console.error("Error creating payment:", error);

    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
};
