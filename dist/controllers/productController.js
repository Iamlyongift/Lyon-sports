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
exports.deleteProduct = exports.updateProduct = exports.getSingleProduct = exports.getAllProducts = exports.createproduct = void 0;
const productModel_1 = __importDefault(require("../models/productModel"));
const utils_1 = require("../utils/utils");
const cloudinary_1 = require("cloudinary");
const createproduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateProduct = utils_1.creatProductSchema.validate(req.body, utils_1.option);
        if (validateProduct.error) {
            return res
                .status(400)
                .json({ Error: validateProduct.error.details[0].message });
        }
        const { item_name, category, description, price, stock } = req.body;
        let pictureUrl = "";
        if (req.file) {
            try {
                const result = yield cloudinary_1.v2.uploader.upload(req.file.path);
                pictureUrl = result.secure_url;
            }
            catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ message: "Error uploading image" });
            }
        }
        else {
            pictureUrl = req.body.image || "";
        }
        const product = yield productModel_1.default.create({
            item_name,
            category,
            description,
            price,
            stock,
            image: pictureUrl,
        });
        res.status(201).json({ message: "Product created successfully", product });
    }
    catch (error) {
        console.error("Error in createproduct:", error);
        res.status(500).json({ message: "Error creating product" });
    }
});
exports.createproduct = createproduct;
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const getAllProduct = yield productModel_1.default.find().populate("orders");
        res.status(200).json({
            msg: "Program sucessfully fetched",
            getAllProduct,
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.getAllProducts = getAllProducts;
const getSingleProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield productModel_1.default.findById(id);
        if (!product) {
            return res.status(400).json({
                msg: "product not found",
            });
        }
        res.status(200).json({
            msg: "product sucessfully fetched",
            product,
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.getSingleProduct = getSingleProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const validateUser = utils_1.updateProductSchema.validate(req.body, utils_1.option);
        if (validateUser.error) {
            return res
                .status(400)
                .json({ Error: validateUser.error.details[0].message });
        }
        const product = yield productModel_1.default.findById(id);
        if (!product) {
            return res.status(400).json({
                error: "program not found",
            });
        }
        const updateProduct = yield productModel_1.default.findByIdAndUpdate(id, Object.assign({}, req.body), {
            new: true,
            runValidators: true,
            context: "query",
        });
        if (!updateProduct) {
            return res.status(404).json({
                msg: "product not updated",
            });
        }
        return res.status(200).json({
            message: "product updated successfully",
            updateProduct,
        });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: "An error occurred while updating the product" });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield productModel_1.default.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({
                message: "product not found",
            });
        }
        res.status(200).json({
            message: "product successfully deleted",
            product,
        });
    }
    catch (error) {
        console.log("Problem deleting product");
    }
});
exports.deleteProduct = deleteProduct;
