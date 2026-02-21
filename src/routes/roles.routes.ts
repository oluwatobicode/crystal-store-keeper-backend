import Router from "express";
import { roleController } from "../controllers";

const router = Router();

router.post("/", roleController.createRole);
router.get("/", roleController.getAllRoles);
router.patch("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

export default router;
