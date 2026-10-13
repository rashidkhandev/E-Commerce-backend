import mongoose from 'mongoose';

/**
 * Validate MongoDB ObjectId parameter
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}'.`,
      });
    }
    next();
  };
};
