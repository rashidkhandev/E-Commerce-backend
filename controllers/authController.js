import User from '../models/User.js';
import { generateTokenAndSetCookie, clearTokenCookie } from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Role safety: normal registration defaults to 'user'
    const assignedRole = role === 'admin' && process.env.ALLOW_ADMIN_REGISTRATION === 'true' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: assignedRole,
    });

    const token = generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password field since it is omitted by default in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    const token = generateTokenAndSetCookie(res, user._id);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  clearTokenCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name slug price discountPrice images rating');
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
