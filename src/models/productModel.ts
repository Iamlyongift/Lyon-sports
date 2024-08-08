import mongoose, { Schema, Document } from "mongoose";

export interface ProductType extends Document {
  _id: mongoose.Types.ObjectId;
  item_name: string;
  category: string;
  price: number;
  description: string;
  stock: number;
  image: string;
}

const ProductSchema: Schema = new Schema(
  {
    item_name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    stock: { type: Number, required: true },
    image: { type: String, required: true },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const ProductModel = mongoose.model<ProductType>("Product", ProductSchema);

export default ProductModel;
