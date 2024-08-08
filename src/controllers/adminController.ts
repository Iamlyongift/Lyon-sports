import mongoose from "mongoose";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { adminLoginSchema, adminRegistrationSchema } from "../utils/utils";
import UserModel from "../models/userModel";

const jwtsecret = process.env.JWT_SECRET as string;
const adminKey = process.env.ADMIN_REGISTRATION_KEY;

export const adminRegister = async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const { error, value } = adminRegistrationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, email, password, adminKey } = value;

    // Check if the adminKey is correct
    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({ message: "Invalid admin key" });
    }

    // Check if the username already exists
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new UserModel({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Error in admin registration:", error);
    res.status(500).json({ message: "Error creating admin" });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const { error, value } = adminLoginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = value;

    const user = await UserModel.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if the user is an admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin rights required." });
    }
    // In your login function
    const token = jwt.sign({ _id: user._id, role: user.role }, jwtsecret, {
      expiresIn: "30d",
    });

    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};
