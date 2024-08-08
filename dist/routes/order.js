"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const orderController_1 = require("../controllers/orderController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post("/createOrder", orderController_1.createOrder);
router.get("/getAllOrders", orderController_1.getAllOrders);
router.get("/getOrder/:id", orderController_1.getOrder);
router.put("/updateOrder/:id", orderController_1.updateOrder);
router.delete("/deleteOrder/:id", orderController_1.deleteOrder);
router.post("/confirm-delivery", orderController_1.confirmDelivery);
router.use(auth_1.requireAdmin);
router.put("/approve/:id", orderController_1.approveOrder);
exports.default = router;
