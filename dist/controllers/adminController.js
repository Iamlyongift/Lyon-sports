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
exports.adminLogin = exports.adminRegister = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const utils_1 = require("../utils/utils");
const userModel_1 = __importDefault(require("../models/userModel"));
const jwtsecret = process.env.JWT_SECRET;
const adminKey = process.env.ADMIN_REGISTRATION_KEY;
const adminRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = utils_1.adminRegistrationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { username, email, password, adminKey } = value;
        if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
            return res.status(403).json({ message: "Invalid admin key" });
        }
        const existingUser = yield userModel_1.default.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newAdmin = new userModel_1.default({
            username,
            email,
            password: hashedPassword,
            role: "admin",
        });
        yield newAdmin.save();
        res.status(201).json({ message: "Admin created successfully" });
    }
    catch (error) {
        console.error("Error in admin registration:", error);
        res.status(500).json({ message: "Error creating admin" });
    }
});
exports.adminRegister = adminRegister;
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = utils_1.adminLoginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { username, password } = value;
        const user = yield userModel_1.default.findOne({ username });
        if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        if (user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Access denied. Admin rights required." });
        }
        const token = jsonwebtoken_1.default.sign({ _id: user._id, role: user.role }, jwtsecret, {
            expiresIn: "30d",
        });
        res.json({ token, role: user.role });
    }
    catch (error) {
        console.error("Error in admin login:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});
exports.adminLogin = adminLogin;
