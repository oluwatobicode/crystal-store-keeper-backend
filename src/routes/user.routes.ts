import { Router } from "express";
import { userController } from "../controllers";

const router = Router();

router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);
router.delete("/:id", userController.deleteUser);
router.put("/:id", userController.updateUser);
router.get("/:id", userController.getUser);

export default router;
