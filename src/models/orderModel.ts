import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // Added price field
}

export interface OrderItemInput {
  product: string;
  quantity: number;
  price: number; // Added price field
}

export interface PaymentDetails {
  method: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  totalAmount?: string; // Added for Stripe Checkout
  cardLast4?: string;
  cardBrand?: string;
}

export interface OrderType extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status:
    | "pending"
    | "paid"
    | "confirmed"
    | "dispatched"
    | "completed"
    | "processing"
    | "canceled";
  paymentStatus: "pending" | "paid" | "failed";
  paymentDetails?: PaymentDetails;
  totalAmount: number;
  deliveryDate?: Date;
  shippingAddress: string;
  currency: string; // Added currency field
}

export const PaymentDetailsSchema: Schema = new Schema(
  {
    method: { type: String, required: true },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    totalAmount: { type: String }, // Added for Stripe Checkout
    cardLast4: { type: String },
    cardBrand: { type: String },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Added price field
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "confirmed",
        "processing",
        "dispatched",
        "completed",
        "canceled",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentDetails: PaymentDetailsSchema,
    deliveryDate: { type: Date },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    currency: { type: String, required: true, default: "usd" }, // Added currency field
  },
  { timestamps: true }
);

// Index for faster queries on Stripe session ID
OrderSchema.index({ "paymentDetails.stripeSessionId": 1 });

const OrderModel = mongoose.model<OrderType>("Order", OrderSchema);

export default OrderModel;
