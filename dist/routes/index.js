"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const productController_1 = require("../controllers/productController");
const upoadImages_1 = require("../library/helpers/upoadImages");
const router = express_1.default.Router();
router.use(auth_1.auth, auth_1.requireAdmin);
router.post("/createproduct", upoadImages_1.upload.single("image"), productController_1.createproduct);
router.put("/updateProduct/:id", productController_1.updateProduct);
router.get("/getAllProduct", productController_1.getAllProducts);
router.get("/getSingleProduct/:id", productController_1.getSingleProduct);
router.delete("/deleteProduct/:id", productController_1.deleteProduct);
exports.default = router;
