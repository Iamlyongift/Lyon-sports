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
exports.confirmDelivery = exports.approveOrder = exports.getAllOrders = exports.deleteOrder = exports.updateOrder = exports.getOrder = exports.createOrder = void 0;
const utils_1 = require("../utils/utils");
const orderModel_1 = __importDefault(require("../models/orderModel"));
const productModel_1 = __importDefault(require("../models/productModel"));
const stripe_1 = __importDefault(require("stripe"));
const userModel_1 = __importDefault(require("../models/userModel"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new stripe_1.default(stripeSecret);
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = utils_1.orderSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { items, shippingAddress, userId, email } = value;
        if (!shippingAddress ||
            !shippingAddress.street ||
            !shippingAddress.city ||
            !shippingAddress.state ||
            !shippingAddress.country ||
            !shippingAddress.zipCode) {
            return res
                .status(400)
                .json({ message: "All shipping address fields are required" });
        }
        let totalAmount = 0;
        const orderItems = [];
        for (const item of items) {
            const product = yield productModel_1.default.findById(item.product);
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
            product.stock -= item.quantity;
            yield product.save();
        }
        const newOrder = new orderModel_1.default({
            user: userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            status: "pending",
            paymentStatus: "pending",
            paymentDetails: {
                method: "pending",
            },
        });
        yield newOrder.save();
        const transporter = nodemailer_1.default.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "31fcae5b162f4a",
                pass: "01824d868af815",
            },
        });
        const mailOptions = {
            from: "your_email@example.com",
            to: email,
            subject: "Your order has been placed",
            text: `Thank you for your order! Your order number is ${newOrder._id}.`,
        };
        yield transporter.sendMail(mailOptions);
        res
            .status(201)
            .json({ message: "Order created successfully", order: newOrder });
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            message: "Error creating order",
            error: error.message,
        });
    }
});
exports.createOrder = createOrder;
const getOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        const order = yield orderModel_1.default.findById(orderId)
            .populate("user")
            .populate("items.product");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching order", error });
    }
});
exports.getOrder = getOrder;
const updateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = utils_1.updateOrderSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const orderId = req.params.id;
        const updatedOrder = yield orderModel_1.default.findByIdAndUpdate(orderId, value, {
            new: true,
        });
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(updatedOrder);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating order", error });
    }
});
exports.updateOrder = updateOrder;
const deleteOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        const deletedOrder = yield orderModel_1.default.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: "Order deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting order", error });
    }
});
exports.deleteOrder = deleteOrder;
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield orderModel_1.default.find()
            .populate("user")
            .populate("items.product");
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
});
exports.getAllOrders = getAllOrders;
const approveOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const user = yield userModel_1.default.findById(req.user._id);
        if (!user || user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can approve orders" });
        }
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Order ID is required" });
        }
        const order = yield orderModel_1.default.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.status === "confirmed") {
            return res.status(400).json({ message: "Order is already confirmed" });
        }
        if (order.paymentStatus !== "paid") {
            return res.status(400).json({ message: "Order is not paid yet" });
        }
        order.status = "confirmed";
        yield order.save();
        res.json({ message: "Order approved successfully", order });
    }
    catch (error) {
        console.error("Error approving order:", error);
        res.status(500).json({
            message: "Error approving order",
            error: error.message,
        });
    }
});
exports.approveOrder = approveOrder;
const confirmDelivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.body;
        if (!orderId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid orderId" });
        }
        const order = yield orderModel_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.status !== "dispatched") {
            return res
                .status(400)
                .json({ message: "Order cannot be completed at this stage" });
        }
        order.status = "completed";
        yield order.save();
        res.status(200).json({ message: "Order status updated to completed" });
    }
    catch (error) {
        console.error("Error confirming delivery:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.confirmDelivery = confirmDelivery;
