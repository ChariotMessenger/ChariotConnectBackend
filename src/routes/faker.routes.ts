import { Router, Request, Response, NextFunction } from "express";
import { DevSeederController } from "../controllers/faker.controller";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dev Tools
 *   description: Utilities for development and testing mode only
 */

/**
 * @swagger
 * /dev/seed/customer:
 *   post:
 *     summary: Seed Mock Customer
 *     description: Creates a random customer in the database for testing (Dev Mode Only).
 *     tags:
 *       - Dev Tools
 *     responses:
 *       201:
 *         description: Mock customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     password:
 *                       type: string
 *       403:
 *         description: Forbidden - Seeding is not allowed in production
 */
router.post(
  "/seed/customer",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DevSeederController.seedCustomer(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /dev/seed/vendor:
 *   post:
 *     summary: Seed Mock Vendor
 *     description: Creates a random vendor in the database for testing (Dev Mode Only).
 *     tags:
 *       - Dev Tools
 *     responses:
 *       201:
 *         description: Mock vendor created successfully
 */
router.post(
  "/seed/vendor",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DevSeederController.seedVendor(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /dev/seed/rider:
 *   post:
 *     summary: Seed Mock Rider
 *     description: Creates a random rider in the database for testing (Dev Mode Only).
 *     tags:
 *       - Dev Tools
 *     responses:
 *       201:
 *         description: Mock rider created successfully
 */
router.post(
  "/seed/rider",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DevSeederController.seedRider(req, res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
