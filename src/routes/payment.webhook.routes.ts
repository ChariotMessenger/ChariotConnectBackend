import { Router } from "express";
import {
  handlePaystackWebhook,
  handlePawaPayWebhook,
} from "../services/payment.webhooks";

const router = Router();

router.post("/webhooks/paystack", handlePaystackWebhook);
router.post("/webhooks/pawapay", handlePawaPayWebhook);

export const paymentWebhookRouter = router;
