import express from "express";
import { adminLogin, adminRegister } from "../controllers/adminController";

const router = express.Router();

/* GET users listing. */

router.post("/adminReg", adminRegister);
router.post("/adminLogin", adminLogin);

export default router;
