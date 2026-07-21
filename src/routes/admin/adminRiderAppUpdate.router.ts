import { Router } from "express";
import {
  handleGetRiderAppUpdates,
  handleUpdateRiderAppUpdate,
} from "../../controllers/admin/adminRiderAppUpdate.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.get("/rider", authMiddleware, handleGetRiderAppUpdates);
router.put("/rider/:key", authMiddleware, handleUpdateRiderAppUpdate);

export const adminRiderAppUpdateRouter = router;
