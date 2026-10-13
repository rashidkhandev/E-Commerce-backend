import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes: verifies JWT from HTTP-only cookie OR Authorization Bearer header.
 */
export const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // 1) Read from HTTP-Only cookie if present
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // 2) Or fallback to Authorization Bearer header (for API/mobile/Postman clients)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.',
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'rashid_store_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    // Find user in database
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this authentication session no longer exists.',
      });
    }

    if (!currentUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};
