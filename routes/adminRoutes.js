import express from 'express';
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  updateUser,
} from '../controllers/adminController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { validateProductInput } from '../validators/productValidator.js';
import { validateObjectId } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Strict security: require both valid authentication and admin role
router.use(authenticateUser, requireAdmin);

router.get('/dashboard', getDashboardStats);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', validateObjectId('id'), updateOrderStatus);

// Product management
router.post('/products', validateProductInput, createProduct);
router
  .route('/products/:id')
  .put(validateObjectId('id'), updateProduct)
  .delete(validateObjectId('id'), deleteProduct);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', validateObjectId('id'), updateUser);

export default router;
