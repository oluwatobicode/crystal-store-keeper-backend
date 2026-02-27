"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
const response_1 = require("../utils/response");
const Product_1 = __importDefault(require("../models/Product"));
const config_1 = require("../config");
// Create Product
const createProduct = async (req, res, next) => {
    try {
        const { name, unit, SKU, purchaseCost, sellingPrice } = req.body;
        // Validate required fields
        if (!name ||
            !unit ||
            !SKU ||
            purchaseCost == null ||
            sellingPrice == null) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.PRODUCT_MESSAGES.MISSING_FIELDS);
        }
        // Check for duplicate SKU
        const existingProduct = await Product_1.default.findOne({ SKU: SKU.toUpperCase() });
        if (existingProduct) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.PRODUCT_MESSAGES.DUPLICATE_SKU);
        }
        const newProduct = await Product_1.default.create(req.body);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.PRODUCT_MESSAGES.CREATED, newProduct);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Create product error:", error);
        return next(error);
    }
};
exports.createProduct = createProduct;
// Get All Products
const getAllProducts = async (req, res, next) => {
    try {
        const products = await Product_1.default.find();
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, products.length > 0 ? config_1.PRODUCT_MESSAGES.FETCHED : "No products found", products);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get all products error:", error);
        return next(error);
    }
};
exports.getAllProducts = getAllProducts;
// Get Single Product
const getProductById = async (req, res, next) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.PRODUCT_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.PRODUCT_MESSAGES.FETCHED_ONE, product);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get product by ID error:", error);
        return next(error);
    }
};
exports.getProductById = getProductById;
// this will help to update Product
const updateProduct = async (req, res, next) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.PRODUCT_MESSAGES.NOT_FOUND);
        }
        // If SKU is being changed, check for duplicates
        if (req.body.SKU && req.body.SKU.toUpperCase() !== product.SKU) {
            const duplicateSKU = await Product_1.default.findOne({
                SKU: req.body.SKU.toUpperCase(),
            });
            if (duplicateSKU) {
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.PRODUCT_MESSAGES.DUPLICATE_SKU);
            }
        }
        const updatedProduct = await Product_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.PRODUCT_MESSAGES.UPDATED, updatedProduct);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update product error:", error);
        return next(error);
    }
};
exports.updateProduct = updateProduct;
//  Delete a Product
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.PRODUCT_MESSAGES.NOT_FOUND);
        }
        await Product_1.default.findByIdAndDelete(req.params.id);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.PRODUCT_MESSAGES.DELETED);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Delete product error:", error);
        return next(error);
    }
};
exports.deleteProduct = deleteProduct;
