import { Request, Response } from "express";
import ProductModel from "../models/productModel";
import {
  creatProductSchema,
  option,
  updateProductSchema,
} from "../utils/utils";
import { v2 as cloudinaryV2 } from "cloudinary";

export const createproduct = async (req: Request, res: Response) => {
  try {
    // Validate the request body using productSchema
    const validateProduct = creatProductSchema.validate(req.body, option);
    if (validateProduct.error) {
      return res
        .status(400)
        .json({ Error: validateProduct.error.details[0].message });
    }

    // Destructure and assign the values from the request body
    const { item_name, category, description, price, stock } = req.body;

    // Initialize a variable to store the picture URL
    let pictureUrl = "";

    // Check if a file was uploaded
    if (req.file) {
      try {
        // Upload the image to Cloudinary and retrieve its URL
        const result = await cloudinaryV2.uploader.upload(req.file.path);
        pictureUrl = result.secure_url; // Store the URL of the uploaded picture
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Error uploading image" });
      }
    } else {
      // If no file was uploaded, use the image URL from the request body if provided
      pictureUrl = req.body.image || "";
    }

    // Create a new product instance
    const product = await ProductModel.create({
      item_name,
      category,
      description,
      price,
      stock,
      image: pictureUrl,
    });

    // Return a success response
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Error in createproduct:", error);
    // Return an error response in case of exceptions
    res.status(500).json({ message: "Error creating product" });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const getAllProduct = await ProductModel.find().populate("orders");
    res.status(200).json({
      msg: "Program sucessfully fetched",
      getAllProduct,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(400).json({
        msg: "product not found",
      });
    }
    res.status(200).json({
      msg: "product sucessfully fetched",
      product,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate the request body
    const validateUser = updateProductSchema.validate(req.body, option);
    if (validateUser.error) {
      return res
        .status(400)
        .json({ Error: validateUser.error.details[0].message });
    }

    // Check if the product exists
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(400).json({
        error: "program not found",
      });
    }

    // Update the product
    const updateProduct = await ProductModel.findByIdAndUpdate(
      id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    if (!updateProduct) {
      return res.status(404).json({
        msg: "product not updated",
      });
    }

    return res.status(200).json({
      message: "product updated successfully",
      updateProduct,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the product" });
  }
};

//delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    res.status(200).json({
      message: "product successfully deleted",
      product,
    });
  } catch (error) {
    console.log("Problem deleting product");
  }
};
