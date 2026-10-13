import express from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { validateObjectId } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(authenticateUser, requireAdmin, createCategory);
router.get('/:slug', getCategoryBySlug);
router
  .route('/:id')
  .put(authenticateUser, requireAdmin, validateObjectId('id'), updateCategory)
  .delete(authenticateUser, requireAdmin, validateObjectId('id'), deleteCategory);

export default router;
