import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import { APIFeatures } from '../utils/apiFeatures.js';

/**
 * @desc    Fetch all products with search, filter, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    // If category slug is supplied, find category ObjectId first
    let queryFilter = { ...req.query };
    if (queryFilter.category && !mongoose.Types.ObjectId.isValid(queryFilter.category)) {
      const categoryDoc = await Category.findOne({ slug: queryFilter.category.toLowerCase() });
      if (categoryDoc) {
        queryFilter.category = categoryDoc._id;
      }
    }

    // Clone query for counting total matching documents
    const countFeatures = new APIFeatures(Product.find(), queryFilter).search().filter();
    const totalDocs = await countFeatures.query.countDocuments();

    // Query with sorting & pagination
    const features = new APIFeatures(
      Product.find().populate('category', 'name slug'),
      queryFilter
    )
      .search()
      .filter()
      .sort()
      .paginate(totalDocs);

    const products = await features.query;

    res.json({
      success: true,
      count: products.length,
      pagination: features.paginationMeta,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch single product by slug or MongoDB ID
 * @route   GET /api/products/:identifier
 * @access  Public
 */
export const getProductByIdentifier = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let product;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier).populate('category', 'name slug description');
    } else {
      product = await Product.findOne({ slug: identifier.toLowerCase() }).populate(
        'category',
        'name slug description'
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with the requested identifier.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick search suggestions (names, brands, categories)
 * @route   GET /api/products/search/suggestions
 * @access  Public
 */
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const products = await Product.find({
      $or: [{ name: regex }, { brand: regex }, { sku: regex }],
    })
      .select('name slug brand price discountPrice images')
      .limit(6);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/collections/featured
 * @access  Public
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ featured: true })
      .populate('category', 'name slug')
      .limit(8);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trending / bestsellers
 * @route   GET /api/products/collections/trending
 * @access  Public
 */
export const getTrendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $or: [{ bestseller: true }, { rating: { $gte: 4.5 } }],
    })
      .populate('category', 'name slug')
      .sort({ rating: -1, reviewCount: -1 })
      .limit(8);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get new arrivals
 * @route   GET /api/products/collections/new-arrivals
 * @access  Public
 */
export const getNewArrivals = async (req, res, next) => {
  try {
    const products = await Product.find({ newArrival: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get flash sale deals (products with highest discount)
 * @route   GET /api/products/collections/flash-deals
 * @access  Public
 */
export const getFlashSaleProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ discountPercentage: { $gt: 0 } })
      .populate('category', 'name slug')
      .sort({ discountPercentage: -1 })
      .limit(6);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get related products
 * @route   GET /api/products/:id/related
 * @access  Public
 */
export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const current = await Product.findById(id);

    if (!current) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      category: current.category,
      _id: { $ne: current._id },
    })
      .populate('category', 'name slug')
      .limit(4);

    res.json({
      success: true,
      data: related,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product reviews
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ product: id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ product: id, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product.',
      });
    }

    const review = await Review.create({
      product: id,
      user: req.user._id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for your feedback!',
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};
