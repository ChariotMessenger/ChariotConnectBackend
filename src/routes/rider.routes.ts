import { Router, Request, Response, NextFunction } from "express";
import { riderController } from "../controllers/rider.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /riders/register:
 *   post:
 *     summary: Rider Registration
 *     description: Register a new rider with all required documents and information
 *     tags:
 *       - Rider Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - birthday
 *               - gender
 *               - country
 *               - state
 *               - areaOfWork
 *               - drivingLicenseUrl
 *               - ninNumber
 *               - idCardUrl
 *               - bikePlateNumber
 *               - guarantorName
 *               - guarantorRelationship
 *               - guarantorPhone
 *               - guarantorNin
 *               - guarantorIdCardUrl
 *               - bankName
 *               - accountNumber
 *               - accountName
 *               - verifyIdentityUrl
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *               areaOfWork:
 *                 type: string
 *               drivingLicenseUrl:
 *                 type: string
 *               ninNumber:
 *                 type: string
 *               idCardUrl:
 *                 type: string
 *               bikePlateNumber:
 *                 type: string
 *               guarantorName:
 *                 type: string
 *               guarantorRelationship:
 *                 type: string
 *               guarantorPhone:
 *                 type: string
 *               guarantorNin:
 *                 type: string
 *               guarantorIdCardUrl:
 *                 type: string
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               accountName:
 *                 type: string
 *               verifyIdentityUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rider registered successfully
 */
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.register(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/login/step-1:
 *   post:
 *     summary: Rider Login Step 1
 *     description: Send OTP to rider email
 *     tags:
 *       - Rider Authentication
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
 *         description: OTP sent successfully
 */
router.post(
  "/login/step-1",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.loginStep1(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/login/step-2:
 *   post:
 *     summary: Rider Login Step 2
 *     description: Verify OTP and login
 *     tags:
 *       - Rider Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post(
  "/login/step-2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.loginStep2(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

// Protected routes
router.use(authMiddleware);

/**
 * @swagger
 * /riders/profile:
 *   get:
 *     summary: Get Rider Profile
 *     tags:
 *       - Rider Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider profile retrieved
 */
router.get(
  "/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.getProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/profile:
 *   put:
 *     summary: Update Rider Profile
 *     tags:
 *       - Rider Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.updateProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/profile/photo:
 *   post:
 *     summary: Upload Profile Photo
 *     tags:
 *       - Rider Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile photo updated
 */
router.post(
  "/profile/photo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.uploadProfilePhoto(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/go-online:
 *   post:
 *     summary: Go Online
 *     description: Set rider status to online for accepting rides
 *     tags:
 *       - Rider Operations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider is now online
 */
router.post(
  "/go-online",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.goOnline(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/go-offline:
 *   post:
 *     summary: Go Offline
 *     description: Set rider status to offline
 *     tags:
 *       - Rider Operations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider is now offline
 */
router.post(
  "/go-offline",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.goOffline(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/online:
 *   get:
 *     summary: Get Online Riders
 *     description: Fetch all online riders in a specific state
 *     tags:
 *       - Rider Operations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Online riders retrieved
 */
router.get(
  "/online",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.getOnlineRiders(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
