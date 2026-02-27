"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers");
const router = (0, express_1.default)();
router.post("/", controllers_1.roleController.createRole);
router.get("/", controllers_1.roleController.getAllRoles);
router.patch("/:id", controllers_1.roleController.updateRole);
router.delete("/:id", controllers_1.roleController.deleteRole);
exports.default = router;
