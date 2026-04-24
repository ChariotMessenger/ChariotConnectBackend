import { Router, Request, Response, NextFunction } from "express";
import { customerController } from "../controllers/customer.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /customers/register/step-1:
 *   post:
 *     summary: Customer Registration Step 1
 *     description: Initiate customer registration by providing basic information and receiving OTP
 *     tags:
 *       - Customer Authentication
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
 *               - password
 *               - gender
 *               - country
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               password:
 *                type: string
 *                format: password
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               receiveMarketingEmails:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  "/register/step-1",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.registerStep1(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/me:
 *   delete:
 *     summary: Delete Customer Account
 *     description: Permanently delete the authenticated customer's account and all associated data
 *     tags:
 *       - Customer Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 */
router.delete(
  "/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.deleteAccount(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     description: Resend verification OTP to the customer email
 *     tags:
 *       - Customer Authentication
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
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 */
router.post(
  "/resend-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.resendOTP(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/forgot-password/step-1:
 *   post:
 *     summary: Forgot Password Step 1
 *     description: Request a password reset OTP by providing the account email
 *     tags:
 *       - Customer Authentication
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
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset OTP sent successfully
 *       404:
 *         description: Customer not found
 */
router.post(
  "/forgot-password/step-1",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.forgotPasswordStep1(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/forgot-password/step-2:
 *   post:
 *     summary: Forgot Password Step 2
 *     description: Reset password using the OTP received in step 1
 *     tags:
 *       - Customer Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/forgot-password/step-2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.forgotPasswordStep2(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/register/step-2:
 *   post:
 *     summary: Customer Registration Step 2
 *     description: Verify OTP and finalize the customer account creation
 *     tags:
 *       - Customer Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - password
 *               - firstName
 *               - lastName
 *               - phone
 *               - birthday
 *               - gender
 *               - country
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthday:
 *                 type: string
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               receiveMarketingEmails:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Customer registered successfully
 */
router.post(
  "/register/step-2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.registerStep2(req, res);
    } catch (error) {
      next(error);
    }
  },
);
/**
 * @swagger
 * /customers/login:
 *   post:
 *     summary: Login with Password
 *     description: Authenticate customer using email or phone number and password
 *     tags:
 *       - Customer Authentication
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
 *                 description: The customer's registered email address or phone number
 *                 example: user@example.com or +2348012345678
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.loginWithPassword(req, res);
    } catch (error) {
      next(error);
    }
  },
);
/**
 * @swagger
 * /customers/login/step-1:
 *   post:
 *     summary: Customer Login Step 1
 *     description: Send OTP to customer email
 *     tags:
 *       - Customer Authentication
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
      await customerController.loginStep1(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/login/step-2:
 *   post:
 *     summary: Customer Login Step 2
 *     description: Verify OTP and login to get JWT token
 *     tags:
 *       - Customer Authentication
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
 *         description: Successfully logged in, returns JWT token
 */
router.post(
  "/login/step-2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.loginStep2(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

// Protected routes
const protectedRouter = Router();
protectedRouter.use(authMiddleware as any);

/**
 * @swagger
 * /customers/profile:
 *   get:
 *     summary: Get Customer Profile
 *     description: Retrieve authenticated customer profile information
 *     tags:
 *       - Customer Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 */
protectedRouter.get(
  "/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.getProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/profile:
 *   put:
 *     summary: Update Customer Profile
 *     tags:
 *       - Customer Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
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
 *               receiveMarketingEmails:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
protectedRouter.put(
  "/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.updateProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/profile/photo:
 *   post:
 *     summary: Upload Customer Profile Photo
 *     tags:
 *       - Customer Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 */
protectedRouter.post(
  "/profile/photo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.uploadProfilePhoto(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/vendors/by-location:
 *   post:
 *     summary: Fetch Vendors by Location
 *     tags:
 *       - Customer Operations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               radiusKm:
 *                 type: number
 *     responses:
 *       200:
 *         description: Vendors retrieved successfully
 */
protectedRouter.post(
  "/vendors/by-location",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.fetchVendorsByLocation(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/favorites:
 *   post:
 *     summary: Add Vendor to Favorites
 *     tags:
 *       - Customer Operations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor added to favorites
 */
protectedRouter.post(
  "/favorites",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.addFavorite(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/favorites:
 *   delete:
 *     summary: Remove Vendor from Favorites
 *     tags:
 *       - Customer Operations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor removed from favorites
 */
protectedRouter.delete(
  "/favorites",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.removeFavorite(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/favorites:
 *   get:
 *     summary: Get Customer Favorites
 *     tags:
 *       - Customer Operations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer favorites retrieved successfully
 */
protectedRouter.get(
  "/favorites",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.getFavorites(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/reviews:
 *   post:
 *     summary: Create Review for Vendor
 *     tags:
 *       - Customer Operations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - rating
 *             properties:
 *               vendorId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
protectedRouter.post(
  "/reviews",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.createReview(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/messages/vendor:
 *   post:
 *     summary: Message a Vendor
 *     tags:
 *       - Customer Messaging
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message room created/retrieved
 */
protectedRouter.post(
  "/messages/vendor",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.messageVendor(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/messages/conversations:
 *   get:
 *     summary: Get Customer Conversations
 *     tags:
 *       - Customer Messaging
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer conversations retrieved
 */
protectedRouter.get(
  "/messages/conversations",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.getConversations(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /customers/messages/{roomId}:
 *   get:
 *     summary: Get Room Messages
 *     tags:
 *       - Customer Messaging
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Room messages retrieved
 */
protectedRouter.get(
  "/messages/:roomId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.getRoomMessages(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

router.use("/", protectedRouter);

export default router;
