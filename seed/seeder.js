import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { categories, products } from './seedData.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const importData = async () => {
  try {
    await connectDB();

    console.log('🔄 Cleaning old collections...');
    await Order.deleteMany();
    await Review.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    console.log('📦 Seeding Categories...');
    const createdCategories = await Category.insertMany(categories);
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
      categoryMap[cat.name.toLowerCase()] = cat._id;
      categoryMap[cat.name] = cat._id;
      categoryMap[cat.slug.replace(/-/g, '')] = cat._id;
    });

    console.log('👤 Seeding Users...');
    // Seed demo accounts
    const adminUser = await User.create({
      name: 'Muhammad Rashid (Lead Developer & Admin)',
      email: 'admin@rashidstore.com',
      password: process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123456',
      phone: '03347784456',
      role: 'admin',
      address: {
        street: 'Main Commercial Avenue',
        city: 'Islamabad',
        province: 'Federal',
        postalCode: '44000',
        country: 'Pakistan',
      },
    });

    const devAdminUser = await User.create({
      name: 'Muhammad Rashid',
      email: 'rashidwazir093@gmail.com',
      password: 'Rashid@123456',
      phone: '03347784456',
      role: 'admin',
      address: {
        street: 'Tech Zone Block B',
        city: 'Islamabad',
        province: 'Federal',
        postalCode: '44000',
        country: 'Pakistan',
      },
    });

    const customerUser = await User.create({
      name: 'Shopper Demo',
      email: 'user@rashidstore.com',
      password: 'User@123456',
      phone: '03001234567',
      role: 'user',
      address: {
        street: 'Street 42, Sector F-7/2',
        city: 'Islamabad',
        province: 'Federal',
        postalCode: '44000',
        country: 'Pakistan',
      },
    });

    console.log('🛍️ Seeding Products...');
    const mappedProducts = products.map((prod) => {
      const categoryId = categoryMap[prod.categorySlug];
      const { categorySlug, ...rest } = prod;
      return {
        ...rest,
        category: categoryId,
      };
    });

    const createdProducts = await Product.insertMany(mappedProducts);

    console.log('⭐ Seeding Reviews...');
    const reviewData = [
      {
        product: createdProducts[0]._id,
        user: customerUser._id,
        rating: 5,
        comment: 'Outstanding sound quality and ANC. Battery lasts through long flights easily!',
      },
      {
        product: createdProducts[1]._id,
        user: customerUser._id,
        rating: 5,
        comment: 'M3 Max handles 4K video rendering without a stutter. Worth every single penny.',
      },
      {
        product: createdProducts[4]._id,
        user: customerUser._id,
        rating: 5,
        comment: 'Extremely comfortable for long runs. Great cushioning and arch support.',
      },
    ];
    await Review.insertMany(reviewData);

    console.log('🧾 Seeding Sample Orders...');
    const sampleOrder1 = await Order.create({
      user: customerUser._id,
      orderNumber: 'RS-202610-A91B8C',
      orderItems: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          image: createdProducts[0].images[0],
          price: createdProducts[0].discountPrice || createdProducts[0].price,
          quantity: 1,
          sku: createdProducts[0].sku,
        },
      ],
      shippingAddress: {
        fullName: customerUser.name,
        phone: customerUser.phone,
        email: customerUser.email,
        street: customerUser.address.street,
        city: customerUser.address.city,
        province: customerUser.address.province,
        postalCode: customerUser.address.postalCode,
        country: customerUser.address.country,
      },
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      subtotal: 349,
      discount: 0,
      shipping: 0,
      tax: 17.45,
      total: 366.45,
      isPaid: true,
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isDelivered: true,
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      statusHistory: [
        { status: 'Pending', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), note: 'Order placed.' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), note: 'Verified by store.' },
        { status: 'Processing', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), note: 'Packed at warehouse.' },
        { status: 'Shipped', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), note: 'Dispatched via Express Courier.' },
        { status: 'Delivered', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), note: 'Successfully delivered to customer.' },
      ],
    });

    const sampleOrder2 = await Order.create({
      user: customerUser._id,
      orderNumber: 'RS-202610-C73E4D',
      orderItems: [
        {
          product: createdProducts[4]._id,
          name: createdProducts[4].name,
          image: createdProducts[4].images[0],
          price: createdProducts[4].discountPrice || createdProducts[4].price,
          quantity: 2,
          sku: createdProducts[4].sku,
        },
      ],
      shippingAddress: {
        fullName: customerUser.name,
        phone: customerUser.phone,
        email: customerUser.email,
        street: customerUser.address.street,
        city: customerUser.address.city,
        province: customerUser.address.province,
        postalCode: customerUser.address.postalCode,
        country: customerUser.address.country,
      },
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Processing',
      subtotal: 256,
      discount: 0,
      shipping: 0,
      tax: 12.8,
      total: 268.8,
      isPaid: false,
      isDelivered: false,
      statusHistory: [
        { status: 'Pending', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), note: 'Order placed.' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), note: 'Confirmed with customer.' },
        { status: 'Processing', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), note: 'Preparing order packaging.' },
      ],
    });

    console.log('========================================================');
    console.log('✅ Rashid Store Database Seeded Successfully!');
    console.log(`📁 Categories Created: ${createdCategories.length}`);
    console.log(`📦 Products Created:   ${createdProducts.length}`);
    console.log(`🧾 Sample Orders:      2`);
    console.log('--------------------------------------------------------');
    console.log('🔑 DEMO ADMIN CREDENTIALS:');
    console.log('   Email:    admin@rashidstore.com');
    console.log('   Password: Admin@123456');
    console.log('   Role:     admin');
    console.log('--------------------------------------------------------');
    console.log('🔑 DEMO DEVELOPER CREDENTIALS:');
    console.log('   Email:    rashidwazir093@gmail.com');
    console.log('   Password: Rashid@123456');
    console.log('   Role:     admin');
    console.log('--------------------------------------------------------');
    console.log('👤 DEMO CUSTOMER CREDENTIALS:');
    console.log('   Email:    user@rashidstore.com');
    console.log('   Password: User@123456');
    console.log('   Role:     user');
    console.log('========================================================');

    process.exit();
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    console.log('🧹 Purging all database records...');
    await Order.deleteMany();
    await Review.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log('✅ All data destroyed successfully.');
    process.exit();
  } catch (error) {
    console.error(`❌ Data destruction failed: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
