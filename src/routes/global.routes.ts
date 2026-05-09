import { Router } from "express";
import { GlobalController } from "../controllers/global.controller";

const router = Router();

router.get("/countries", GlobalController.getCountries);
router.get("/countries/:iso", GlobalController.getCountryDetails);

export default router;
