import { Router } from "express";
import {
  handleGetVendorAppUpdates,
  handleUpdateVendorAppUpdate,
} from "../../controllers/admin/adminVendorAppUpdate.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.get("/vendor", authMiddleware, handleGetVendorAppUpdates);
router.put("/vendor/:key", authMiddleware, handleUpdateVendorAppUpdate);

export const adminVendorAppUpdateRouter = router;
