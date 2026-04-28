import { Router, Request, Response, NextFunction } from "express";
import { vendorController } from "../controllers/vendor.controller";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Point:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           format: float
 *         longitude:
 *           type: number
 *           format: float
 *        locationName:
 *          type: string
 */

/**
 * @swagger
 * /vendors/register/step-1:
 *   post:
 *     summary: Vendor Registration Step 1
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
 *                 $ref: '#/components/schemas/Point'
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
 * /vendors/me:
 *   delete:
 *     summary: Delete Vendor Account
 *     description: Permanently delete the authenticated vendor's account, catalog, and associated data
 *     tags:
 *       - Vendor Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 */
router.delete(
  "/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.deleteAccount(req as any, res);
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
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               receiveMarketingEmails:
 *                 type: boolean
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
 * /vendors/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     description: Resend verification OTP to the vendor email
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
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 */
router.post(
  "/resend-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.resendOTP(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/forgot-password/step-1:
 *   post:
 *     summary: Vendor Forgot Password Step 1
 *     description: Request a password reset OTP by providing the vendor account email
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
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset OTP sent successfully
 *       404:
 *         description: Vendor not found
 */
router.post(
  "/forgot-password/step-1",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.forgotPasswordStep1(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/forgot-password/step-2:
 *   post:
 *     summary: Vendor Forgot Password Step 2
 *     description: Reset vendor password using the OTP received in step 1
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
      await vendorController.forgotPasswordStep2(req as any, res);
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
 *     description: Authenticate vendor using email or phone number and password
 *     tags:
 *       - Vendor Authentication
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
 *                 description: The vendor's registered email address or phone number
 *                 example: vendor@business.com or +2347000000000
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Invalid credentials
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
const protectedRouter = Router();
protectedRouter.use(authMiddleware as any);
/**
 * @swagger
 * /vendors/profile:
 *   put:
 *     summary: Update Vendor Profile
 *     tags:
 *       - Vendor Profile
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
 *               businessName:
 *                 type: string
 *               bio:
 *                 type: string
 *               vendorServiceType:
 *                 type: string
 *                 example: PICKUP_AND_DELIVERY
 *               vendorWorkPeriod:
 *                 type: object
 *                 description: JSON object for opening hours
 *               businessAddress:
 *                 $ref: '#/components/schemas/Point'
 *               receiveMarketingEmails:
 *                 type: boolean
 *               currentLocation:
 *                 $ref: '#/components/schemas/Point'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
protectedRouter.put(
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
 * /vendors/profile:
 *   get:
 *     summary: Get Vendor Profile
 *     description: Returns the complete vendor profile including branding, operational hours, and verification status.
 *     tags:
 *       - Vendor Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     country:
 *                       type: string
 *                     currency:
 *                       type: string
 *                     businessType:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     businessAddress:
 *                       $ref: '#/components/schemas/Point'
 *                     isOwner:
 *                       type: boolean
 *                     isBusinessRegistered:
 *                       type: boolean
 *                     brandLogoUrl:
 *                       type: string
 *                       nullable: true
 *                     coverPhotoUrl:
 *                       type: string
 *                       nullable: true
 *                     bio:
 *                       type: string
 *                       nullable: true
 *                     rank:
 *                       type: number
 *                       format: float
 *                     vendorWorkPeriod:
 *                       type: object
 *                       nullable: true
 *                     vendorServiceType:
 *                       type: string
 *                       nullable: true
 *                     verificationStatus:
 *                       type: string
 *                       enum:
 *                         - PENDING
 *                         - VERIFIED
 *                         - REJECTED
 *                     receiveMarketingEmails:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     currentLocation:
 *                       $ref: '#/components/schemas/Point'
 */
protectedRouter.get(
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
 * /vendors/profile/brand-logo:
 *   patch:
 *     summary: Upload Brand Logo
 *     tags:
 *       - Vendor Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Brand logo updated
 */
protectedRouter.patch(
  "/profile/brand-logo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.uploadBrandLogo(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /vendors/profile/cover-photo:
 *   patch:
 *     summary: Upload Cover Photo
 *     tags:
 *       - Vendor Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover photo updated
 */
protectedRouter.patch(
  "/profile/cover-photo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.uploadCoverPhoto(req as any, res);
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
protectedRouter.post(
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
protectedRouter.put(
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
protectedRouter.delete(
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
protectedRouter.get(
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
 *     summary: Get vendor's received orders with pagination
 *     tags: [Vendor Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - WAITING_FOR_APPROVAL
 *             - AWAITING_PAYMENT
 *             - PAID
 *             - VENDOR_PACKING
 *             - AWAITING_PICK_UP
 *             - DELIVERED
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
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       customer:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
protectedRouter.get(
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
protectedRouter.get(
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
protectedRouter.get(
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
protectedRouter.get(
  "/reviews",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vendorController.getVendorReviews(req as any, res);
    } catch (error) {
      next(error);
    }
  },
);
router.use("/", protectedRouter);
export default router;
