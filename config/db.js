import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Connect to MongoDB database.
 * Uses process.env.MONGO_URI (Atlas cluster or local instance).
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rashid-store';

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`
----------------------------------------------------------------------
💡 TIP FOR RUNNING E-COMMERCE:
1. If using MongoDB Atlas (Recommended):
   - Copy connection string from Atlas Dashboard
   - Update MONGO_URI in backend/.env:
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/rashid-store?retryWrites=true&w=majority
2. If using Local MongoDB:
   - Ensure MongoDB service is started (net start MongoDB or mongod)
3. To populate database:
   - Run: npm run seed
----------------------------------------------------------------------
    `);
    throw error;
  }
};
