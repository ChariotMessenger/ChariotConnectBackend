import { Router, Request, Response, NextFunction } from "express";
import { riderController } from "../controllers/rider.controller";
import { authMiddleware } from "../middlewares/auth";
import { upload } from "../middlewares/multer";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rider Authentication
 *   description: Multi-step registration process for riders
 */

/**
 * @swagger
 * /riders/banks:
 *   get:
 *     summary: Get supported banks
 *     description: Retrieve a list of supported banks based on country for Step 3
 *     tags: [Rider Authentication]
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         example: nigeria
 *     responses:
 *       200:
 *         description: List of banks retrieved successfully
 */
router.get("/banks", (req: Request, res: Response, next: NextFunction) => {
  riderController.getSupportedBanks(req as any, res).catch(next);
});

/**
 * @swagger
 * /riders/register/step-1:
 *   post:
 *     summary: Registration Step 1 - Personal Info
 *     description: Validate basic information and check for existing accounts
 *     tags: [Rider Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, birthday, gender, country, password]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               birthday: { type: string, format: date }
 *               gender: { type: string }
 *               country: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Step 1 validated
 */
router.post(
  "/register/step-1",
  (req: Request, res: Response, next: NextFunction) => {
    riderController.registerStepOne(req as any, res).catch(next);
  },
);
/**
 * @swagger
 * /riders/register/step-2:
 *   post:
 *     summary: Registration Step 2 - Documents & Work
 *     description: Upload identity documents and provide work/guarantor details. Returns URLs of uploaded documents to be used in the final registration step.
 *     tags: [Rider Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - state
 *               - areaOfWork
 *               - ninNumber
 *               - bikePlateNumber
 *               - guarantorName
 *               - guarantorRelationship
 *               - guarantorPhone
 *               - guarantorNin
 *               - drivingLicense
 *               - idCard
 *               - guarantorIdCard
 *             properties:
 *               email:
 *                 type: string
 *                 example: rider@example.com
 *               state:
 *                 type: string
 *               areaOfWork:
 *                 type: string
 *               ninNumber:
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
 *               drivingLicense:
 *                 type: string
 *                 format: binary
 *               idCard:
 *                 type: string
 *                 format: binary
 *               guarantorIdCard:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Documents uploaded
 *                 data:
 *                   type: object
 *                   properties:
 *                     drivingLicenseUrl:
 *                       type: string
 *                       example: https://storage.com/path/to/license.jpg
 *                     idCardUrl:
 *                       type: string
 *                       example: https://storage.com/path/to/idcard.jpg
 *                     guarantorIdCardUrl:
 *                       type: string
 *                       example: https://storage.com/path/to/guarantor.jpg
 *       400:
 *         description: Missing required fields or file upload error
 */
router.post(
  "/register/step-2",
  upload.fields([
    { name: "drivingLicense", maxCount: 1 },
    { name: "idCard", maxCount: 1 },
    { name: "guarantorIdCard", maxCount: 1 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    riderController.registerStepTwo(req as any, res).catch(next);
  },
);

/**
 * @swagger
 * /riders/register/step-4:
 *   post:
 *     summary: Registration Step 4 - Finalize
 *     description: Final identity verification and account creation. This endpoint requires ALL data collected from previous steps to persist the rider to the database.
 *     tags: [Rider Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *               - birthday
 *               - gender
 *               - country
 *               - state
 *               - areaOfWork
 *               - drivingLicenseUrl
 *               - idCardUrl
 *               - guarantorIdCardUrl
 *               - ninNumber
 *               - bikePlateNumber
 *               - guarantorName
 *               - guarantorRelationship
 *               - guarantorPhone
 *               - guarantorNin
 *               - bankName
 *               - accountNumber
 *               - accountName
 *               - verifyIdentity
 *             properties:
 *               # Step 1 Data
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, format: password }
 *               birthday: { type: string, format: date }
 *               gender: { type: string }
 *               country: { type: string }
 *               # Step 2 Data (Urls returned from Step 2)
 *               state: { type: string }
 *               areaOfWork: { type: string }
 *               drivingLicenseUrl: { type: string }
 *               idCardUrl: { type: string }
 *               guarantorIdCardUrl: { type: string }
 *               ninNumber: { type: string }
 *               bikePlateNumber: { type: string }
 *               guarantorName: { type: string }
 *               guarantorRelationship: { type: string }
 *               guarantorPhone: { type: string }
 *               guarantorNin: { type: string }
 *               # Step 3 Data (Validated via Paystack)
 *               bankName: { type: string }
 *               accountNumber: { type: string }
 *               accountName: { type: string }
 *               # Step 4 Data (The actual file)
 *               verifyIdentity:
 *                 type: string
 *                 format: binary
 *                 description: Real-time selfie or identity verification photo
 *     responses:
 *       201:
 *         description: Rider registered successfully. Documents are under review.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     email: { type: string }
 *                     status: { type: string }
 *       400:
 *         description: Validation error or missing fields
 */
router.post(
  "/register/step-4",
  upload.fields([{ name: "verifyIdentity", maxCount: 1 }]),
  (req: Request, res: Response, next: NextFunction) => {
    riderController.registerStepFour(req as any, res).catch(next);
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
 * /riders/forgot-password-step1:
 *   post:
 *     summary: Forgot Password Step 1
 *     description: Request an OTP for password reset via email or phone number
 *     tags:
 *       - Rider Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Email or Phone Number is required
 */
router.post(
  "/forgot-password-step1",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.forgotPasswordStep1(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /riders/forgot-password-step2:
 *   post:
 *     summary: Forgot Password Step 2
 *     description: Reset password using the received OTP
 *     tags:
 *       - Rider Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Missing required fields
 */
router.post(
  "/forgot-password-step2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.forgotPasswordStep2(req as any, res);
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
 * /riders/location-history:
 *   get:
 *     summary: Get Rider Location History
 *     description: Retrieve a paginated list of historical locations for the authenticated rider
 *     tags:
 *       - Rider Location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/location-history",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await riderController.getLocationHistory(req, res);
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
