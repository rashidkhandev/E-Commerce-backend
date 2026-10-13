import Category from '../models/Category.js';
import Product from '../models/Product.js';

/**
 * @desc    Get all active categories with product counts
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort('name');

    // Aggregate product counts for each category
    const productCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    productCounts.forEach((pc) => {
      countMap[pc._id.toString()] = pc.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat.toObject(),
      productCount: countMap[cat._id.toString()] || 0,
    }));

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category by slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug.toLowerCase() });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, active } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80',
      active: active !== undefined ? active : true,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, active } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (image) category.image = image;
    if (active !== undefined) category.active = active;

    const updatedCategory = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Safety check: Prevent deletion if products reference this category
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}". It has ${productCount} active products assigned to it. Reassign or remove products first.`,
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
