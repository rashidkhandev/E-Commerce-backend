import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';

/**
 * @desc    Get Admin Dashboard KPI metrics and analytics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    // Calculate total revenue from non-cancelled orders
    const salesAggregate = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: '$total' } } },
    ]);
    const totalSales = salesAggregate.length > 0 ? Math.round(salesAggregate[0].totalSales * 100) / 100 : 0;

    // Recent 6 orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    // Products running low on stock (stock <= 5)
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .select('name sku stock price images')
      .limit(8);

    // Categories breakdown
    const categoriesCount = await Category.countDocuments();

    res.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        totalUsers,
        totalProducts,
        pendingOrders,
        deliveredOrders,
        categoriesCount,
        recentOrders,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders with filtering and pagination
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 12);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== 'all') {
      query.orderStatus = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { 'shippingAddress.fullName': searchRegex },
        { 'shippingAddress.email': searchRegex },
      ];
    }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: orders.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status & payment status
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) {
      order.orderStatus = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status} by administrator.`,
      });

      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
        // If cash on delivery, mark paid upon delivery
        if (order.paymentMethod === 'Cash on Delivery') {
          order.paymentStatus = 'Paid';
          order.isPaid = true;
          order.paidAt = new Date();
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      discountPrice,
      category,
      brand,
      images,
      stock,
      sku,
      featured,
      bestseller,
      newArrival,
      specifications,
    } = req.body;

    // Check SKU uniqueness
    const generatedSku = sku ? sku.toUpperCase().trim() : `RS-${Date.now().toString().slice(-6)}`;
    const existingSku = await Product.findOne({ sku: generatedSku });
    if (existingSku) {
      return res.status(400).json({ success: false, message: 'A product with this SKU already exists.' });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      shortDescription: shortDescription || '',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      category,
      brand: brand.trim(),
      images,
      stock: Number(stock),
      sku: generatedSku,
      featured: Boolean(featured),
      bestseller: Boolean(bestseller),
      newArrival: newArrival !== undefined ? Boolean(newArrival) : true,
      specifications: specifications || [],
    });

    const savedProduct = await product.save();
    const populated = await Product.findById(savedProduct._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing product
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const fields = [
      'name',
      'description',
      'shortDescription',
      'price',
      'discountPrice',
      'category',
      'brand',
      'images',
      'stock',
      'sku',
      'featured',
      'bestseller',
      'newArrival',
      'specifications',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updatedProduct = await product.save();
    const populated = await Product.findById(updatedProduct._id).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 15);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: users.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role or active status
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety: prevent admin from demoting or disabling self
    if (user._id.toString() === req.user._id.toString()) {
      if (role && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Security protection: You cannot remove your own admin privileges.',
        });
      }
      if (isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Security protection: You cannot deactivate your own account.',
        });
      }
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
