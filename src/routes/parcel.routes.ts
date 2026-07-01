import { Router, Request, Response } from "express";
import { ParcelDeliveryService } from "../services/parcel.service";
import {
  handleParcelPaystackWebhook,
  handleParcelPawaPayWebhook,
} from "../controllers/payment.webhooks";
import { authMiddleware } from "../middlewares/auth";
import { AuthRequest } from "../middlewares/auth";

import { upload } from "../middlewares/multer";
const router = Router();
router.use(authMiddleware);
/**
 * @swagger
 * tags:
 *   - name: Parcel Delivery
 *     description: Management and tracking of multi-stop parcel delivery lifecycles
 */

/**
 * @swagger
 * /webhooks/parcel/paystack:
 *   post:
 *     summary: Paystack Payment Webhook
 *     description: Inbound webhook verification listener for processed Paystack transactions.
 *     tags:
 *       - Parcel Delivery
 *     responses:
 *       200:
 *         description: Event acknowledged successfully
 *       401:
 *         description: Invalid hash verification signature
 */
router.post("/webhooks/parcel/paystack", handleParcelPaystackWebhook);

/**
 * @swagger
 * /webhooks/parcel/pawapay:
 *   post:
 *     summary: PawaPay Payment Webhook
 *     description: Inbound webhook verification listener for processed mobile wallet payments in RWF.
 *     tags:
 *       - Parcel Delivery
 *     responses:
 *       200:
 *         description: Event acknowledged successfully
 */
router.post("/webhooks/parcel/pawapay", handleParcelPawaPayWebhook);
/**
 * @swagger
 * /parcel/initialize:
 *   post:
 *     summary: Initialize a Multi-Stop Parcel Delivery Order
 *     description: Computes route metrics using location parameters, provisions verification tracking codes, uploads multiple parcel item images via multipart/form-data, and records an unallocated shipment entity.
 *     tags:
 *       - Parcel Delivery
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - pickupLocation
 *               - expectedPickupTime
 *             properties:
 *               customerId:
 *                 type: string
 *               expectedPickupTime:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 default: NGN
 *               note:
 *                 type: string
 *               pickupLocation:
 *                 type: string
 *                 description: JSON stringified object containing latitude, longitude, and address keys
 *                 example: '{"latitude": 6.4541, "longitude": 3.3947, "fullAddress": "10 Broad Street"}'
 *               deliveryStops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     receiverName:
 *                       type: string
 *                     receiverPhoneNumber:
 *                       type: string
 *                     stopLocation:
 *                       type: string
 *                       description: JSON stringified object containing latitude and longitude keys
 *                       example: '{"latitude": 6.4281, "longitude": 3.4219}'
 *                     itemPhotosUrl:
 *                       type: string
 *                       format: binary
 *                       description: Raw binary image asset for the specific delivery milestone index
 *     responses:
 *       201:
 *         description: Delivery lifecycle initiated successfully
 *       400:
 *         description: Missing configurations, invalid object strings, or schema formatting mismatch
 */
router.post(
  "/parcel/initialize",
  upload.any(),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      const record = await ParcelDeliveryService.initializeParcelDelivery(
        req.body,
        files,
      );

      res.status(201).json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);
/**
 * @swagger
 * /parcel/{id}/pay:
 *   post:
 *     summary: Generate Gateway Payment Instance
 *     description: Evaluates international currencies to spawn dynamic mobile wallet checkout parameters or Paystack link instances.
 *     tags:
 *       - Parcel Delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout properties compiled successfully
 *       400:
 *         description: Unrecognized shipment identifier index
 */
router.post("/parcel/:id/pay", async (req: AuthRequest, res: Response) => {
  try {
    const payload = await ParcelDeliveryService.generatePaymentLink(
      req.params.id,
      req.body.email,
    );
    res.status(200).json(payload);
  } catch (err: any) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});
/**
 * @swagger
 * /rider/available-jobs:
 * get:
 * summary: Query Open Distribution Pipelines
 * description: Returns a paginated collection of unassigned jobs waiting for dispatch acceptance.
 * tags:
 * - Parcel Delivery
 * parameters:
 * - in: query
 *   name: page
 *   schema:
 *     type: integer
 *     default: 1
 *   description: Current page matrix indicator
 * - in: query
 *   name: limit
 *   schema:
 *     type: integer
 *     default: 20
 *   description: Total database record extraction capacity per layout
 * responses:
 *   200:
 *     description: Array compilation rendered successfully with pagination context
 *   400:
 *     description: Service transaction fault execution
 */
router.get("/rider/available-jobs", async (req: AuthRequest, res: Response) => {
  try {
    const page = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const jobs = await ParcelDeliveryService.listAvailableDeliveries({
      page,
      limit,
    });

    res.status(200).json(jobs);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /customer/parcel-history/{customerId}:
 * get:
 * summary: Retrieve Customer Parcel History
 * description: Fetches a paginated history of parcel deliveries initiated by a specific customer, accompanied by status aggregates.
 * tags:
 * - Parcel Delivery
 * parameters:
 * - in: path
 *   name: customerId
 *   required: true
 *   schema:
 *     type: string
 *   description: MongoDB document identifier of the target customer account
 * - in: query
 *   name: page
 *   schema:
 *     type: integer
 *     default: 1
 * - in: query
 *   name: limit
 *   schema:
 *     type: integer
 *     default: 20
 * responses:
 *   200:
 *     description: Successfully compiled customer structural records and status totals
 *   400:
 *     description: Invalid input formatting or execution failure
 */
router.get(
  "/customer/parcel-history/:customerId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { customerId } = req.params;
      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      const history = await ParcelDeliveryService.listCustomerDeliveries({
        customerId,
        page,
        limit,
      });

      res.status(200).json(history);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);

/**
 * @swagger
 * /rider/parcel-history/{riderId}:
 * get:
 * summary: Retrieve Rider Assignment History
 * description: Fetches a paginated compilation of parcel distribution pipelines associated with a specific dispatch operator.
 * tags:
 * - Parcel Delivery
 * parameters:
 * - in: path
 *   name: riderId
 *   required: true
 *   schema:
 *     type: string
 *   description: MongoDB document identifier of the target rider account
 * - in: query
 *   name: page
 *   schema:
 *     type: integer
 *     default: 1
 * - in: query
 *   name: limit
 *   schema:
 *     type: integer
 *     default: 20
 * responses:
 *   200:
 *     description: Successfully compiled rider structural records and status totals
 *   400:
 *     description: Invalid input formatting or execution failure
 */
router.get(
  "/rider/parcel-history/:riderId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { riderId } = req.params;
      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      const history = await ParcelDeliveryService.listRiderDeliveries({
        riderId,
        page,
        limit,
      });

      res.status(200).json(history);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);

/**
 * @swagger
 * /rider/accept/{id}:
 *   post:
 *     summary: Claim Available Delivery Pipeline
 *     description: Binds an active rider identity value directly onto the shipment model state.
 *     tags:
 *       - Parcel Delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - riderId
 *             properties:
 *               riderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Courier profile mapping transaction successful
 *       400:
 *         description: Target manifest instance locked or claimed by alternative asset
 */
router.post("/rider/accept/:id", async (req: AuthRequest, res: Response) => {
  try {
    const update = await ParcelDeliveryService.acceptDeliveryJob(
      req.params.id,
      req.body.riderId,
    );
    res.status(200).json(update);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rider/start-transit/{id}:
 *   post:
 *     summary: Signal Transit Activity Engagement
 *     description: Shifts delivery context into the active tracking layout mode and appends current temporal stamps.
 *     tags:
 *       - Parcel Delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Core routing status progress altered to active state
 *       400:
 *         description: Underlying database schema processing issue
 */
router.post(
  "/rider/start-transit/:id",
  async (req: AuthRequest, res: Response) => {
    try {
      const update = await ParcelDeliveryService.triggerProgressState(
        req.params.id,
      );
      res.status(200).json(update);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);
/**
 * @swagger
 * /rider/verify-stop/{id}:
 *   post:
 *     summary: Verify Destination Milestone Tracking Key
 *     description: Validates structural token compliance keys against target stops to update terminal drop-off points.
 *     tags:
 *       - Parcel Delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - keyInput
 *             properties:
 *               label:
 *                 type: string
 *               keyInput:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sequence verified. Milestone state updated accurately
 *       400:
 *         description: Verification verification terminated due to key mismatch errors
 */
router.post(
  "/rider/verify-stop/:id",
  async (req: AuthRequest, res: Response) => {
    try {
      const { label, keyInput } = req.body;
      const result = await ParcelDeliveryService.verifyStopConfirmationKey(
        req.params.id,
        label,
        keyInput,
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);
export const parcelRouter = router;
