import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Load environment variables
dotenv.config();

const app = express();

// Global exception handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Production CORS configuration
const allowedOrigins = [
  'https://skillvouch-hexart.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Environment validation
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Start database connection
connectDB();

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Response helper function
const createResponse = (success, message, data = null, status = 200) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Health check route
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json(createResponse(true, 'Server is healthy', {
    status: 'OK',
    database: dbStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }));
});

app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json(createResponse(true, 'Backend is healthy', {
    status: 'OK',
    database: dbStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }));
});

// Auth routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json(createResponse(false, 'Email and password are required'));
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(createResponse(false, 'User already exists'));
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json(createResponse(true, 'User created successfully', { token }));
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json(createResponse(false, 'Server error', null, 500));
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json(createResponse(false, 'Email and password are required'));
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json(createResponse(false, 'Invalid credentials'));
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json(createResponse(false, 'Invalid credentials'));
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json(createResponse(true, 'Login successful', { token }));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createResponse(false, 'Server error', null, 500));
  }
});

// Profile route
app.get("/api/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json(createResponse(false, 'No token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json(createResponse(false, 'User not found'));
    }
    
    res.status(200).json(createResponse(true, 'Profile retrieved', { user }));
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json(createResponse(false, 'Invalid token'));
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json(createResponse(false, 'CORS error', null, 403));
  }
  
  res.status(500).json(createResponse(false, 'Internal server error', null, 500));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json(createResponse(false, 'Route not found', null, 404));
});

// Dynamic PORT usage
const PORT = process.env.PORT || 5000;

// Server listen with proper error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});

export default app;
