import { Router, Request, Response } from "express";
import { ParcelDeliveryService } from "../services/parcel.service";
import {
  handleParcelPaystackWebhook,
  handleParcelPawaPayWebhook,
} from "../controllers/payment.webhooks";

const router = Router();
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
 *     description: Computes route metrics using location parameters, provisions verification tracking codes, and records an unallocated shipment entity.
 *     tags:
 *       - Parcel Delivery
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - pickupLocation
 *               - expectedPickupTime
 *               - deliveryStops
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
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   fullAddress:
 *                     type: string
 *               deliveryStops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     stopInfo:
 *                       type: object
 *                       properties:
 *                         receiverName:
 *                           type: string
 *                         receiverPhoneNumber:
 *                           type: string
 *                     stopLocation:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *     responses:
 *       201:
 *         description: Delivery lifecycle initiated successfully
 *       400:
 *         description: Missing configurations or schema formatting mismatch
 */
router.post("/parcel/initialize", async (req: Request, res: Response) => {
  try {
    const record = await ParcelDeliveryService.initializeParcelDelivery(
      req.body,
    );
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
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
router.post("/parcel/:id/pay", async (req: Request, res: Response) => {
  try {
    const payload = await ParcelDeliveryService.generatePaymentLink(
      req.params.id,
      req.body.email,
    );
    res.status(200).json(payload);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rider/available-jobs:
 *   get:
 *     summary: Query Open Distribution Pipelines
 *     description: Returns an aggregated collection of unassigned jobs waiting for dispatch acceptance.
 *     tags:
 *       - Parcel Delivery
 *     responses:
 *       200:
 *         description: Array compilation rendered successfully
 *       400:
 *         description: Service transaction fault execution
 */
router.get("/rider/available-jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await ParcelDeliveryService.listAvailableDeliveries();
    res.status(200).json(jobs);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

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
router.post("/rider/accept/:id", async (req: Request, res: Response) => {
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
router.post("/rider/start-transit/:id", async (req: Request, res: Response) => {
  try {
    const update = await ParcelDeliveryService.triggerProgressState(
      req.params.id,
    );
    res.status(200).json(update);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
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
router.post("/rider/verify-stop/:id", async (req: Request, res: Response) => {
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
});
export const parcelRouter = router;
