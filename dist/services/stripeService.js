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
exports.createPaymentWithToken = void 0;
const stripe_1 = __importDefault(require("stripe"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const createPaymentWithToken = (userId, token, items, shippingAddress) => __awaiter(void 0, void 0, void 0, function* () {
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
        paymentMethod: "stripe",
        shippingAddress,
        currency: "usd",
    });
    try {
        const charge = yield stripe.charges.create({
            amount: Math.round(totalAmount * 100),
            currency: "usd",
            source: token,
            description: `Charge for order ${order.id}`,
            metadata: {
                orderId: order.id,
            },
        });
        yield orderModel_1.default.findByIdAndUpdate(order.id, {
            status: "paid",
            paymentStatus: "paid",
            "paymentDetails.stripeChargeId": charge.id,
        });
        return { charge, orderId: order.id };
    }
    catch (error) {
        yield orderModel_1.default.findByIdAndUpdate(order.id, {
            status: "failed",
            paymentStatus: "failed",
        });
        throw error;
    }
});
exports.createPaymentWithToken = createPaymentWithToken;
