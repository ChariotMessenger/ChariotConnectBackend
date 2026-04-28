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
 *               - password
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
 *               password:
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
 * /riders/verify-email:
 *   post:
 *     summary: Verify Rider Email
 *     description: Verify rider's email using the OTP sent during registration
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
 *         description: Email verified successfully
 */
router.post(
  "/verify-email",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.verifyEmail(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     description: Resend a new verification OTP to the rider's email
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
 *         description: OTP resent successfully
 */
router.post(
  "/resend-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.resendOTP(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/login-password:
 *   post:
 *     summary: Rider Password Login
 *     description: Login using email/phone and password
 *     tags:
 *       - Rider Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or Phone number
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.loginWithPassword(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/me:
 *   delete:
 *     summary: Delete Rider Account
 *     description: Permanently delete the authenticated rider's account and documents
 *     tags:
 *       - Rider Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.deleteAccount(req as any, res);
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

const protectedRouter = Router();
protectedRouter.use(authMiddleware as any);

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
protectedRouter.get(
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               areaOfWork:
 *                 type: string
 *               currentLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     format: float
 *                   longitude:
 *                     type: number
 *                     format: float
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
protectedRouter.put(
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
protectedRouter.post(
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
protectedRouter.post(
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
protectedRouter.post(
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
 * /riders/nearby-jobs:
 *   get:
 *     summary: Get available orders within a specific radius with pagination
 *     tags: [Rider Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Rider's current latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Rider's current longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *         description: Search radius in kilometers
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       pickupLocation:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           locationName:
 *                             type: string
 *                       deliveryLocation:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           locationName:
 *                             type: string
 */
router.get("/nearby-jobs", authMiddleware, riderController.getNearbyJobs);
// /**
//  * @swagger
//  * /riders/online:
//  *   get:
//  *     summary: Get Online Riders
//  *     description: Fetch all online riders in a specific state
//  *     tags:
//  *       - Rider Operations
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: state
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Online riders retrieved
//  */
// protectedRouter.get(
//   "/online",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await riderController.getOnlineRiders(req as any, res);
//     } catch (error) {
//       next(error);
//     }
//   },
// );
router.use("/", protectedRouter);
export default router;
