import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * @desc    Get user profile with recent orders
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        user,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

    if (req.body.address) {
      user.address = {
        street: req.body.address.street || user.address?.street || '',
        city: req.body.address.city || user.address?.city || '',
        province: req.body.address.province || user.address?.province || '',
        postalCode: req.body.address.postalCode || user.address?.postalCode || '',
        country: req.body.address.country || user.address?.country || 'Pakistan',
      };
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are both required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please keep it safe.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's wishlist
 * @route   GET /api/users/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' },
    });

    res.json({
      success: true,
      data: user.wishlist || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add product to wishlist
 * @route   POST /api/users/wishlist/:productId
 * @access  Private
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    const populatedUser = await User.findById(req.user._id).populate('wishlist');

    res.json({
      success: true,
      message: 'Product added to wishlist.',
      data: populatedUser.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/users/wishlist/:productId
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== productId.toString()
    );
    await user.save();

    res.json({
      success: true,
      message: 'Product removed from wishlist.',
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};
