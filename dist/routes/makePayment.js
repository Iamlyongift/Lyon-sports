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
const express_1 = __importDefault(require("express"));
const paymentServices_1 = require("../services/paymentServices");
const payment_1 = require("../controllers/payment");
const router = express_1.default.Router();
router.post("/create-checkout-session", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, items, shippingAddress } = req.body;
        const { session, orderId } = yield (0, paymentServices_1.createCheckoutSession)(userId, items, shippingAddress);
        res.json({ sessionId: session.id, sessionUrl: session.url, orderId });
    }
    catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
}));
router.get("/verify-payment/:orderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    try {
        const paymentInfo = yield (0, paymentServices_1.verifyPayment)(orderId);
        res.json(paymentInfo);
    }
    catch (error) {
        console.error("Error in payment verification route:", error);
        if (error instanceof Error) {
            res
                .status(error.message === "Order not found" ? 404 : 500)
                .json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
}));
router.post("/create-payment", payment_1.createPayment);
router.post("/delivery-webhook", paymentServices_1.deliveryWebhook);
exports.default = router;
