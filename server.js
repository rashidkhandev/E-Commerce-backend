import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start HTTP listener
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('========================================================');
      console.log(`🚀 E-Commerce API Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`👨‍💻 Owner & Lead Developer: Muhammad Rashid`);
      console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
      console.log('========================================================');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error(`Failed to launch server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
