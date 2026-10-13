import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

router.route('/profile').get(getUserProfile).put(updateUserProfile);
router.put('/change-password', changePassword);

router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', validateObjectId('productId'), addToWishlist);
router.delete('/wishlist/:productId', validateObjectId('productId'), removeFromWishlist);

export default router;
