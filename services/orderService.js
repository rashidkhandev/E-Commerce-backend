import Product from '../models/Product.js';

/**
 * Service to validate order items against real-time database products,
 * verify stock availability, and compute tamper-proof prices and totals on the server.
 */
export const calculateAndValidateOrder = async (orderItems) => {
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    throw new Error('Order items cannot be empty.');
  }

  const populatedItems = [];
  let subtotal = 0;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found with ID: ${item.product}`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Only ${product.stock} available, requested: ${item.quantity}`
      );
    }

    // Determine authoritative unit price (use discount price if valid)
    const effectivePrice =
      product.discountPrice > 0 && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    const itemTotal = effectivePrice * item.quantity;
    subtotal += itemTotal;

    populatedItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: effectivePrice,
      quantity: item.quantity,
      sku: product.sku || '',
    });
  }

  // Shipping calculation: Free shipping for orders over $75, otherwise $10
  const shipping = subtotal >= 75 ? 0 : 10;

  // Tax calculation: 5% flat sales tax
  const tax = Math.round(subtotal * 0.05 * 100) / 100;

  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return {
    populatedItems,
    subtotal,
    shipping,
    tax,
    total,
  };
};

/**
 * Deduct inventory stock for ordered items
 */
export const deductProductStock = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }
};

/**
 * Restore inventory stock if order is cancelled
 */
export const restoreProductStock = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
};
