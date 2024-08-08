"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryWebhook = void 0;
exports.createCheckoutSession = createCheckoutSession;
exports.verifyPayment = verifyPayment;
exports.handleStripeWebhook = handleStripeWebhook;
const stripe_1 = __importDefault(require("stripe"));
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
function createCheckoutSession(userId, items, shippingAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const order = yield orderModel_1.default.create({
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
            currency: "usd",
        });
        const lineItems = items.map((item) => ({
            price_data: {
                currency: "usd",
                unit_amount: item.price * 100,
                product_data: {
                    name: item.name,
                    description: item.description,
                },
            },
            quantity: item.quantity,
        }));
        const session = yield stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `https://your-website.com/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://your-website.com/cancel`,
            metadata: {
                orderId: order.id,
            },
        });
        yield orderModel_1.default.findByIdAndUpdate(order.id, {
            "paymentDetails.stripeSessionId": session.id,
        });
        return { session, orderId: order.id };
    });
}
function verifyPayment(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const order = yield orderModel_1.default.findById(orderId);
            if (!order) {
                throw new Error("Order not found");
            }
            let stripeStatus = "unknown";
            let amount = order.totalAmount;
            let currency = order.currency || "usd";
            if ((_a = order.paymentDetails) === null || _a === void 0 ? void 0 : _a.stripePaymentIntentId) {
                try {
                    const paymentIntent = yield stripe.paymentIntents.retrieve(order.paymentDetails.stripePaymentIntentId);
                    stripeStatus = paymentIntent.status;
                    amount = paymentIntent.amount / 100;
                    currency = paymentIntent.currency;
                    if (paymentIntent.status === "succeeded" && order.status !== "paid") {
                        order.status = "paid";
                        order.status = "processing";
                        yield order.save();
                    }
                    else if (paymentIntent.status === "canceled") {
                        order.status = "canceled";
                        yield order.save();
                    }
                }
                catch (stripeError) {
                    console.error("Error retrieving payment intent from Stripe:", stripeError);
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
        }
        catch (error) {
            console.error("Error verifying payment:", error);
            throw error;
        }
    });
}
function handleStripeWebhook(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            switch (event.type) {
                case "checkout.session.completed":
                    yield verifyAndUpdatePayment(event.data.object);
                    break;
                case "payment_intent.succeeded":
                    yield confirmPaymentSuccess(event.data.object);
                    break;
                case "payment_intent.payment_failed":
                    yield handlePaymentFailure(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
        }
        catch (error) {
            console.error("Error processing webhook:", error);
            throw error;
        }
    });
}
function verifyAndUpdatePayment(session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const orderId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            throw new Error("No orderId found in session metadata");
        }
        if (session.payment_status !== "paid") {
            console.log(`Payment not completed for order ${orderId}. Status: ${session.payment_status}`);
            return;
        }
        try {
            const updatedOrder = yield orderModel_1.default.findByIdAndUpdate(orderId, {
                paymentStatus: "paid",
                orderStatus: "processing",
                "paymentDetails.stripeSessionId": session.id,
                "paymentDetails.stripePaymentIntentId": session.payment_intent,
                "paymentDetails.amountPaid": session.amount_total,
                "paymentDetails.currency": session.currency,
            }, { new: true });
            if (!updatedOrder) {
                throw new Error(`Order ${orderId} not found`);
            }
            console.log(`Payment verified and order updated for ${orderId}:`, updatedOrder);
        }
        catch (error) {
            console.error(`Error updating order ${orderId} after payment verification:`, error);
            throw error;
        }
    });
}
function confirmPaymentSuccess(paymentIntent) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const orderId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            console.log("PaymentIntent succeeded but no orderId found in metadata");
            return;
        }
        try {
            const updatedOrder = yield orderModel_1.default.findByIdAndUpdate(orderId, {
                paymentStatus: "paid",
                orderStatus: "processing",
                "paymentDetails.stripePaymentIntentId": paymentIntent.id,
                "paymentDetails.amountPaid": paymentIntent.amount,
                "paymentDetails.currency": paymentIntent.currency,
            }, { new: true });
            if (!updatedOrder) {
                throw new Error(`Order ${orderId} not found when confirming payment success`);
            }
            console.log(`Payment success confirmed for order ${orderId}:`, updatedOrder);
        }
        catch (error) {
            console.error(`Error confirming payment success for order ${orderId}:`, error);
            throw error;
        }
    });
}
function handlePaymentFailure(paymentIntent) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const orderId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            console.log("PaymentIntent failed but no orderId found in metadata");
            return;
        }
        try {
            const updatedOrder = yield orderModel_1.default.findByIdAndUpdate(orderId, {
                paymentStatus: "failed",
                orderStatus: "payment_failed",
                "paymentDetails.stripePaymentIntentId": paymentIntent.id,
                "paymentDetails.lastErrorMessage": (_b = paymentIntent.last_payment_error) === null || _b === void 0 ? void 0 : _b.message,
            }, { new: true });
            if (!updatedOrder) {
                throw new Error(`Order ${orderId} not found when handling payment failure`);
            }
            console.log(`Payment failure recorded for order ${orderId}:`, updatedOrder);
        }
        catch (error) {
            console.error(`Error handling payment failure for order ${orderId}:`, error);
            throw error;
        }
    });
}
const deliveryWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const receivedSecret = req.headers["authorization"];
        if (receivedSecret !== `Bearer ${process.env.STRIPE_WEBHOOK_SECRET}`) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid webhook secret" });
        }
        const { orderId, status, deliveryDate } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid orderId" });
        }
        const validOrderId = new mongoose_1.default.Types.ObjectId(orderId);
        const order = yield orderModel_1.default.findById(validOrderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (status === "delivered") {
            order.status = "completed";
            order.deliveryDate = new Date(deliveryDate);
            yield order.save();
        }
        res.status(200).json({ message: "Order status updated to completed" });
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.deliveryWebhook = deliveryWebhook;
