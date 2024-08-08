import { number } from "joi";
import mongoose, { Document, Schema } from "mongoose";

export interface UserType extends Document {
  username: string;
  email: string;
  password: string;
  phone_number: string;
  country: string;
  role: "user" | "admin";
}

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String, required: false },
    country: { type: String, required: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    ecommerce: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const UserModel = mongoose.model<UserType>("User", userSchema);

export default UserModel;

// import mongoose, { Schema, Document } from 'mongoose';

// export interface IUser extends Document {
//   email: string;
//   password: string;
//   name: string;
//   role: 'user' | 'admin';
//   createdAt: Date;
//   updatedAt: Date;
// }

// const UserSchema: Schema = new Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   name: { type: String, required: true },
//   role: { type: String, enum: ['user', 'admin'], default: 'user' },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// export default mongoose.model<IUser>('User', UserSchema);
