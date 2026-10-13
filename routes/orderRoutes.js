import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from '../controllers/orderController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.route('/').post(createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', validateObjectId('id'), getOrderById);
router.put('/:id/cancel', validateObjectId('id'), cancelOrder);

export default router;
