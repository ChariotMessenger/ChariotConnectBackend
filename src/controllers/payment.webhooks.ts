import { Request, Response } from "express";
import crypto from "crypto";
import { ParcelDeliveryService } from "../services/parcel.service";

export const handleParcelPaystackWebhook = async (
  req: Request,
  res: Response,
) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Unauthorized Access Verification Blocked");
    }

    res.sendStatus(200);
    const event = req.body;
    if (event.event === "charge.success") {
      const parcelId = event.data.metadata.parcelId;
      await ParcelDeliveryService.verifyWebhookPayment(parcelId, "PAYSTACK");
    }
  } catch (error) {
    res.sendStatus(500);
  }
};

export const handleParcelPawaPayWebhook = async (
  req: Request,
  res: Response,
) => {
  try {
    res.sendStatus(200);
    const event = req.body;
    if (event.status === "COMPLETED") {
      const parcelId = event.depositId;
      await ParcelDeliveryService.verifyWebhookPayment(parcelId, "PAWAPAY");
    }
  } catch (error) {
    res.sendStatus(500);
  }
};
