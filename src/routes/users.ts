import express from "express";
import {
  loginUser,
  RegisterUser,
  updateUserProfile,
} from "../controllers/userController";
import { auth } from "../middleware/auth";
const router = express.Router();

/* GET users listing. */

router.post("/register", RegisterUser);
router.post("/login", loginUser);

router.use(auth);

router.put("/update_profile", updateUserProfile);

export default router;
