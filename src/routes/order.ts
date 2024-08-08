import express from "express";
import { auth, requireAdmin } from "../middleware/auth";
import {
  approveOrder,
  confirmDelivery,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrder,
  updateOrder,
} from "../controllers/orderController";

const router = express.Router();

router.use(auth);
// Order routes
router.post("/createOrder", createOrder);
router.get("/getAllOrders", getAllOrders);
router.get("/getOrder/:id", getOrder);
router.put("/updateOrder/:id", updateOrder);
router.delete("/deleteOrder/:id", deleteOrder);
router.post("/confirm-delivery", confirmDelivery);

router.use(requireAdmin);
router.put("/approve/:id", approveOrder);

export default router;
