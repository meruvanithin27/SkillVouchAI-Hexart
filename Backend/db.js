import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

export async function connectDB() {
  try {
    // Validate environment variables
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await mongoose.connect(MONGODB_URI, {
      // Connection options for production
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production deployment failed - check MONGODB_URI');
    } else {
      console.error('💡 Development mode - check local MongoDB instance');
    }
    
    process.exit(1);
  }
}

export default mongoose;
