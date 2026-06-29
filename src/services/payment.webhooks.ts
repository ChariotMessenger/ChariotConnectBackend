import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { OrderService } from "../services/order.service";
import { ParcelDeliveryService } from "./parcel.service";
import { logger } from "../utils/logger";

export const handlePaystackWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    res.sendStatus(200);

    const event = req.body;
    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const parcelId = event.data.metadata?.parcelId;

      if (parcelId) {
        logger.info(`Paystack webhook received for Parcel ID: ${parcelId}`);
        await ParcelDeliveryService.verifyWebhookPayment(parcelId, "PAYSTACK");
      } else {
        logger.info(
          `Paystack webhook received for Order Reference: ${reference}`,
        );
        await OrderService.verifyPayment(reference, "PAYSTACK");
      }
    }
  } catch (error) {
    logger.error("Paystack webhook execution error:", error);
  }
};

export const handlePawaPayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.sendStatus(200);

    const event = req.body;
    if (event.status === "COMPLETED") {
      const reference = event.depositId;
      logger.info(`PawaPay webhook received for depositId: ${reference}`);

      const isParcel =
        await ParcelDeliveryService.checkIfParcelExists(reference);

      if (isParcel) {
        await ParcelDeliveryService.verifyWebhookPayment(reference, "PAWAPAY");
      } else {
        await OrderService.verifyPayment(reference, "PAWAPAY");
      }
    }
  } catch (error) {
    logger.error("PawaPay webhook execution error:", error);
  }
};
