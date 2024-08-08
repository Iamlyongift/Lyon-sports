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
exports.updateUserProfile = exports.loginUser = exports.RegisterUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const utils_1 = require("../utils/utils");
const jwtsecret = process.env.JWT_SECRET;
const RegisterUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, confirm_password, phone_number, country, role, } = req.body;
        const { error, value } = utils_1.RegisterSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            return res
                .status(400)
                .json({ Error: error.details.map((err) => err.message) });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ Error: "Passwords do not match" });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, yield bcryptjs_1.default.genSalt(12));
        const existingUser = yield userModel_1.default.findOne({ email });
        if (!existingUser) {
            const newUser = yield userModel_1.default.create({
                username,
                email,
                password: passwordHash,
                phone_number,
                country,
                role,
            });
            return res.status(200).json({ msg: "Registration successful", newUser });
        }
        return res.status(400).json({ error: "User already exists" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});
exports.RegisterUser = RegisterUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const validateUser = utils_1.LoginSchema.validate(req.body, {
            abortEarly: false,
        });
        if (validateUser.error) {
            return res
                .status(400)
                .json({ Error: validateUser.error.details[0].message });
        }
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        console.log("User found:", user);
        const { _id } = user;
        const validUser = yield bcryptjs_1.default.compare(password, user.password);
        if (!validUser) {
            return res.status(400).json({ error: "Invalid password" });
        }
        const token = jsonwebtoken_1.default.sign({ _id }, jwtsecret, { expiresIn: "30d" });
        return res.status(200).json({
            msg: "Login Successful",
            user,
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.loginUser = loginUser;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        console.log("Validating request body...");
        const { error, value } = utils_1.updateProfileSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            console.log("Validation error:", error.details);
            return res
                .status(400)
                .json({ Error: error.details.map((err) => err.message) });
        }
        console.log("Updating user profile...");
        const profile = yield userModel_1.default.findByIdAndUpdate(req.user._id, {
            username,
        }, { new: true });
        if (!profile) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User updated", profile });
    }
    catch (error) {
        res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.updateUserProfile = updateUserProfile;
