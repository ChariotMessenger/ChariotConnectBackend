import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '../types';

const userRoutes = Router();

userRoutes.use(authenticate);

userRoutes.get('/', authorize(PERMISSIONS.USER_MANAGE), (req, res) => userController.getAllUsers(req, res));
userRoutes.get('/search', authorize(PERMISSIONS.USER_MANAGE), (req, res) => userController.searchUsers(req, res));
userRoutes.get('/:id', authorize(PERMISSIONS.USER_MANAGE), (req, res) => userController.getUserById(req, res));
userRoutes.put('/:id', authorize(PERMISSIONS.USER_MANAGE), (req, res) => userController.updateUser(req, res));
userRoutes.patch('/:id/status', authorize(PERMISSIONS.USER_MANAGE), (req, res) =>
  userController.updateUserStatus(req, res)
);
userRoutes.patch('/:id/reset-password', authorize(PERMISSIONS.USER_MANAGE), (req, res) =>
  userController.resetPassword(req, res)
);
userRoutes.delete('/:id', authorize(PERMISSIONS.USER_MANAGE), (req, res) => userController.deleteUser(req, res));
userRoutes.get('/:id/activity-logs', authorize(PERMISSIONS.ACTIVITY_LOG_READ), (req, res) =>
  userController.getUserActivityLogs(req, res)
);

export default userRoutes;
