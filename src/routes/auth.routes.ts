import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const authRoutes = Router();

authRoutes.post("/register", (req, res) => authController.register(req, res));
authRoutes.post("/login", (req, res) => authController.login(req, res));
authRoutes.post("/verify-otp", (req, res) =>
  authController.verifyOTP(req, res),
);
authRoutes.post("/change-password", authenticate, (req, res) =>
  authController.changePassword(req, res),
);
authRoutes.post("/forgot-password", (req, res) =>
  authController.forgotPassword(req, res),
);
authRoutes.post("/verify-password-reset-otp", (req, res) =>
  authController.verifyPasswordResetOTP(req, res),
);
authRoutes.post("/reset-password", (req, res) =>
  authController.resetPassword(req, res),
);

export default authRoutes;
