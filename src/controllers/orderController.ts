import mongoose from "mongoose";
import { Request, Response } from "express";
import { orderSchema, updateOrderSchema } from "../utils/utils";
import OrderModel, { IOrderItem, OrderItemInput } from "../models/orderModel";
import ProductModel from "../models/productModel";
import Stripe from "stripe";
import UserModel from "../models/userModel";
import nodemailer from "nodemailer";

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(stripeSecret);

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
  };
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { items, shippingAddress, userId, email } = value;

    // Check if shippingAddress has all required fields
    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.country ||
      !shippingAddress.zipCode
    ) {
      return res
        .status(400)
        .json({ message: "All shipping address fields are required" });
    }

    // Validate and calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await ProductModel.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.item_name}`,
        });
      }

      const orderItem = {
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      };

      orderItems.push(orderItem);
      totalAmount += product.price * item.quantity;

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create the order
    const newOrder = new OrderModel({
      user: userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      status: "pending",
      paymentStatus: "pending",
      paymentDetails: {
        method: "pending", // This will be updated when payment is processed
      },
    });

    await newOrder.save();

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
      subject: "Your order has been placed",
      text: `Thank you for your order! Your order number is ${newOrder._id}.`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Error creating order",
      error: (error as Error).message,
    });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId)
      .populate("user")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const orderId = req.params.id;
    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, value, {
      new: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find()
      .populate("user")
      .populate("items.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

export const approveOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if the user is an admin
    const user = await UserModel.findById(req.user._id);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can approve orders" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order is already confirmed
    if (order.status === "confirmed") {
      return res.status(400).json({ message: "Order is already confirmed" });
    }

    // Check if the order is paid
    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Order is not paid yet" });
    }

    // Update order status
    order.status = "confirmed";
    await order.save();

    res.json({ message: "Order approved successfully", order });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({
      message: "Error approving order",
      error: (error as Error).message,
    });
  }
};

// import { Request, Response } from 'express';
// import { OrderModel } from './models/Order'; // Adjust the import based on your project structure

export const confirmDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    // Ensure the orderId is a valid ObjectId
    if (!orderId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    // Find the order by ID
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order status allows for completion
    if (order.status !== "dispatched") {
      return res
        .status(400)
        .json({ message: "Order cannot be completed at this stage" });
    }

    // Update order status to 'completed'
    order.status = "completed";
    await order.save();

    res.status(200).json({ message: "Order status updated to completed" });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add other payment-related controller functions here
