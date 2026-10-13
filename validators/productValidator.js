import mongoose from 'mongoose';

export const validateProductInput = (req, res, next) => {
  const { name, price, category, brand, images, stock } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Product name is required.' });
  }

  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ success: false, message: 'Valid non-negative price is required.' });
  }

  if (!category || !mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ success: false, message: 'A valid category ID is required.' });
  }

  if (!brand || brand.trim() === '') {
    return res.status(400).json({ success: false, message: 'Product brand is required.' });
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one product image is required.' });
  }

  if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ success: false, message: 'Valid non-negative stock quantity is required.' });
  }

  next();
};
