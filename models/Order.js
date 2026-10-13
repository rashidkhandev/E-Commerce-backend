import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sku: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'Pakistan' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash on Delivery', 'Online Payment / Card', 'Bank Transfer'],
      default: 'Cash on Delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to generate random unique order number if not specified
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.orderNumber = `RS-${datePrefix}-${randomHex}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
