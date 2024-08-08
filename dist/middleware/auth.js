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
exports.requireAdmin = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const jwtSecret = process.env.JWT_SECRET;
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let decoded;
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return res.status(401).json({ message: "Kindly sign in as a user" });
        }
        const token = authorization.replace("Bearer ", "");
        try {
            decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        catch (jwtError) {
            return res.status(401).json({ message: "Invalid token" });
        }
        console.log("Token:", token);
        console.log("Decoded:", decoded);
        const user = yield userModel_1.default.findById(decoded._id);
        console.log("User found:", user);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ message: "Authentication error" });
    }
});
exports.auth = auth;
const requireAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin required." });
    }
    next();
};
exports.requireAdmin = requireAdmin;
