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
 * /customers/register/step-2:
 *   post:
 *     summary: Customer Registration Step 2
 *     description: Complete customer registration with OTP verification and password
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
 *         description: Customer registered successfully, returns JWT token
 */
router.post(
  "/register/step-2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.registerStep2(req as any, res);
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
router.use(authMiddleware);

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
router.get(
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
router.put(
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
router.post(
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
router.post(
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
router.post(
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
router.delete(
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
router.get(
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
router.post(
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
router.post(
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
router.get(
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
router.get(
  "/messages/:roomId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerController.getRoomMessages(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
