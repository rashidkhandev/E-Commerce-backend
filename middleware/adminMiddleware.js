/**
 * Restrict access to administrators only.
 * Must be preceded by authenticateUser middleware.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Administrative privileges are required for this action.',
    });
  }
};
