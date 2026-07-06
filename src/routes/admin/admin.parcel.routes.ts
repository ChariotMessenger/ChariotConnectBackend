import { Router } from "express";
import {
  handleGetParcelDeliveries,
  handleGetParcelDeliveryDetails,
} from "../../controllers/admin/admin.parcel.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";

const router = Router();

router.use(authenticateAdmin);

router.get("/parcels", handleGetParcelDeliveries);
router.get("/parcels/:id", handleGetParcelDeliveryDetails);

export const adminParcelRouter = router;
