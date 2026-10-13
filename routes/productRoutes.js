import express from 'express';
import {
  getProducts,
  getProductByIdentifier,
  getSearchSuggestions,
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivals,
  getFlashSaleProducts,
  getRelatedProducts,
  getProductReviews,
  createProductReview,
} from '../controllers/productController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/collections/featured', getFeaturedProducts);
router.get('/collections/trending', getTrendingProducts);
router.get('/collections/new-arrivals', getNewArrivals);
router.get('/collections/flash-deals', getFlashSaleProducts);

router.get('/:id/related', validateObjectId('id'), getRelatedProducts);
router
  .route('/:id/reviews')
  .get(validateObjectId('id'), getProductReviews)
  .post(authenticateUser, validateObjectId('id'), createProductReview);

router.get('/:identifier', getProductByIdentifier);

export default router;
