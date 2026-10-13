import Order from '../models/Order.js';
import {
  calculateAndValidateOrder,
  deductProductStock,
  restoreProductStock,
} from '../services/orderService.js';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required (Full Name, Street, City).',
      });
    }

    // 1. Authoritatively validate items, check stock, and recalculate financials on server
    const { populatedItems, subtotal, shipping, tax, total } =
      await calculateAndValidateOrder(orderItems);

    // 2. Create the order document
    const order = new Order({
      user: req.user._id,
      orderItems: populatedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone ? shippingAddress.phone.trim() : req.user.phone || '',
        email: shippingAddress.email ? shippingAddress.email.trim() : req.user.email,
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        province: shippingAddress.province ? shippingAddress.province.trim() : '',
        postalCode: shippingAddress.postalCode ? shippingAddress.postalCode.trim() : '',
        country: shippingAddress.country || 'Pakistan',
      },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      subtotal,
      discount: 0,
      shipping,
      tax,
      total,
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(),
          note: 'Order placed by customer via Cash on Delivery.',
        },
      ],
    });

    const savedOrder = await order.save();

    // 3. Atomically decrement product inventory stock
    await deductProductStock(populatedItems);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: savedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
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
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: only order owner or admin can view order
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order (if still pending)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this order.',
      });
    }

    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already marked as "${order.orderStatus}".`,
      });
    }

    order.orderStatus = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: req.user.role === 'admin' ? 'Cancelled by admin.' : 'Cancelled by customer.',
    });

    await order.save();

    // Restore inventory stock
    await restoreProductStock(order.orderItems);

    res.json({
      success: true,
      message: 'Order cancelled successfully and inventory restored.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
