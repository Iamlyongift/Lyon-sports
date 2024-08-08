import express from "express";
import { auth, requireAdmin } from "../middleware/auth";
import {
  createproduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/productController";
import { upload } from "../library/helpers/upoadImages";

const router = express.Router();

/* GET home page. */
router.use(auth, requireAdmin);

router.post("/createproduct", upload.single("image"), createproduct);
router.put("/updateProduct/:id", updateProduct);
router.get("/getAllProduct", getAllProducts);
router.get("/getSingleProduct/:id", getSingleProduct);
router.delete("/deleteProduct/:id", deleteProduct);

export default router;
