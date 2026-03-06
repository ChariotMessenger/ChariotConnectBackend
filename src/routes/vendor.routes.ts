import { Router, Request, Response, NextFunction } from "express";
import { vendorController } from "../controllers/vendor.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /vendors/register/step-1:
 *   post:
 *     summary: Vendor Registration Step 1
 *     description: Register vendor with business information
 *     tags:
 *       - Vendor Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country
 *               - businessType
 *               - businessName
 *               - businessAddress
 *               - isOwner
 *               - isBusinessRegistered
 *             properties:
 *               country:
 *                 type: string
 *               businessType:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               isOwner:
 *                 type: boolean
 *               businessOwnerName:
 *                 type: string
 *               isBusinessRegistered:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Business information validated
 */
router.post(
  "/register/step-1",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.registerStep1(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/register/step-2:
 *   post:
 *     summary: Vendor Registration Step 2
 *     tags:
 *       - Vendor Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OTP sent to email
 */
router.post(
  "/register/step-2",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.registerStep2(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/register/step-3:
 *   post:
 *     summary: Vendor Registration Step 3
 *     description: Verify OTP and complete vendor registration
 *     tags:
 *       - Vendor Authentication
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
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 */
router.post(
  "/register/step-3",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.registerStep3(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/login/with-otp:
 *   post:
 *     summary: Vendor Login with OTP
 *     tags:
 *       - Vendor Authentication
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
 *         description: OTP sent to email
 */
router.post(
  "/login/with-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.loginWithOTP(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/login/verify-otp:
 *   post:
 *     summary: Verify OTP and Login
 *     tags:
 *       - Vendor Authentication
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
  "/login/verify-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.verifyLoginOTP(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/login/with-password:
 *   post:
 *     summary: Vendor Login with Password
 *     tags:
 *       - Vendor Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post(
  "/login/with-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.loginWithPassword(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

// Protected routes
router.use(authMiddleware);

/**
 * @swagger
 * /vendors/profile:
 *   get:
 *     summary: Get Vendor Profile
 *     tags:
 *       - Vendor Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile retrieved
 */
router.get(
  "/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/profile:
 *   put:
 *     summary: Update Vendor Profile
 *     tags:
 *       - Vendor Profile
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
      await vendorController.updateProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/profile/photo:
 *   post:
 *     summary: Upload Profile Photo
 *     tags:
 *       - Vendor Profile
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
      await vendorController.uploadProfilePhoto(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/catalog:
 *   post:
 *     summary: Create Catalog Item
 *     tags:
 *       - Vendor Catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catalog item created
 */
router.post(
  "/catalog",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.createCatalogItem(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/catalog/{itemId}:
 *   put:
 *     summary: Update Catalog Item
 *     tags:
 *       - Vendor Catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catalog item updated
 */
router.put(
  "/catalog/:itemId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.updateCatalogItem(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/catalog/{itemId}:
 *   delete:
 *     summary: Delete Catalog Item
 *     tags:
 *       - Vendor Catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catalog item deleted
 */
router.delete(
  "/catalog/:itemId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.deleteCatalogItem(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/catalog:
 *   get:
 *     summary: Get Vendor Catalog
 *     tags:
 *       - Vendor Catalog
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor catalog retrieved
 */
router.get(
  "/catalog",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getCatalog(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/orders:
 *   get:
 *     summary: Get Vendor Orders
 *     tags:
 *       - Vendor Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor orders retrieved
 */
router.get(
  "/orders",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getOrders(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/orders/{orderId}/accept:
 *   post:
 *     summary: Accept Order
 *     tags:
 *       - Vendor Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order accepted
 */
router.post(
  "/orders/:orderId/accept",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.acceptOrder(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/orders/{orderId}/reject:
 *   post:
 *     summary: Reject Order
 *     tags:
 *       - Vendor Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order rejected
 */
router.post(
  "/orders/:orderId/reject",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.rejectOrder(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/orders/{orderId}/complete:
 *   post:
 *     summary: Complete Order
 *     tags:
 *       - Vendor Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order completed
 */
router.post(
  "/orders/:orderId/complete",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.completeOrder(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/messages:
 *   get:
 *     summary: Get Vendor Messages/Conversations
 *     tags:
 *       - Vendor Messaging
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor messages retrieved
 */
router.get(
  "/messages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getMessages(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/messages/{roomId}:
 *   get:
 *     summary: Get Room Messages
 *     tags:
 *       - Vendor Messaging
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room messages retrieved
 */
router.get(
  "/messages/:roomId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getRoomMessages(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/reviews:
 *   get:
 *     summary: Get Vendor Reviews
 *     tags:
 *       - Vendor Reviews
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor reviews retrieved
 */
router.get(
  "/reviews",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getVendorReviews(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
