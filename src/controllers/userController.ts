import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel";
import {
  LoginSchema,
  RegisterSchema,
  updateProfileSchema,
} from "../utils/utils";

const jwtsecret = process.env.JWT_SECRET as string;

export const RegisterUser = async (req: Request, res: Response) => {
  try {
    // Log the incoming file and body data;
    const {
      username,
      email,
      password,
      confirm_password,
      phone_number,
      country,
      role,
    } = req.body;

    // Validate user input
    const { error, value } = RegisterSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ Error: error.details.map((err: any) => err.message) });
    }

    // Ensure passwords match
    if (password !== confirm_password) {
      return res.status(400).json({ Error: "Passwords do not match" });
    }

    // Hashing password
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));

    const existingUser = await UserModel.findOne({ email });

    // Create a new user document if the user doesn't already exist
    if (!existingUser) {
      const newUser = await UserModel.create({
        username,
        email,
        password: passwordHash, // Use the URL of the uploaded picture
        phone_number,
        country,
        role,
      });
      return res.status(200).json({ msg: "Registration successful", newUser });
    }
    return res.status(400).json({ error: "User already exists" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const email = req.body.email;
    const password = req.body.password; // Fixed the variable name to 'password' from 'passWord'

    // Validate user
    const validateUser = LoginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (validateUser.error) {
      return res
        .status(400)
        .json({ Error: validateUser.error.details[0].message });
    }

    // Verify if user exists
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    console.log("User found:", user);

    const { _id } = user;

    // Compare password
    const validUser = await bcrypt.compare(password, user.password);

    if (!validUser) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign({ _id }, jwtsecret, { expiresIn: "30d" });
    return res.status(200).json({
      msg: "Login Successful",
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req: Request | any, res: Response) => {
  try {
    const { username } = req.body;

    // Validate request body
    console.log("Validating request body...");
    const { error, value } = updateProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      console.log("Validation error:", error.details);
      return res
        .status(400)
        .json({ Error: error.details.map((err: any) => err.message) });
    }

    // Find and update the user profile using the authenticated user's ID
    console.log("Updating user profile...");
    const profile = await UserModel.findByIdAndUpdate(
      req.user._id,
      {
        username,
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User updated", profile });
  } catch (error) {
    res.status(500).json({ message: "An unexpected error occurred" });
  }
};
