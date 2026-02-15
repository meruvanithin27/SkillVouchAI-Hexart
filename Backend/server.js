/**
 * @fileoverview SkillVouch AI Backend Server
 * @type {module} - This is a JavaScript ES6 module file
 * @description Backend API server for SkillVouch AI platform
 * @note This file is JavaScript, not TypeScript, despite IDE linting
 * @ts-nocheck - COMPLETELY DISABLE TypeScript checking for this file
 * @ts-ignore - Ignore all TypeScript errors
 * @suppress {checkTypes} - Suppress all type checking
 * @suppress {duplicate} - Suppress duplicate declarations
 * @suppress {missingReturn} - Suppress missing return type errors
 */

// COMPLETE TypeScript DISABLE - This is a JavaScript file
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

// @ts-nocheck
// @ts-ignore-all
// @suppress-all
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for production (Render) - Fix rate limit issue
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  }
});
app.use('/api/', limiter);

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: ["https://skillvouch-hexart.vercel.app", "https://skillvouch-hexart2026.vercel.app", "http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
  credentials: true
}));

// Environment variables with fallbacks
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://meruvanithinkumarreddy_db_user:k6UWfK6UewtlZX44@cluster0.imqsaat.mongodb.net/skillvouch?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || "sQQTP8UgvUDMaorbj4P1aRIcbAyA2uun0o1FV+YdLKM=";
const PORT = process.env.PORT || 5001;

console.log('🔧 Starting server with configuration:');
console.log(`🔗 MongoDB URI: ${MONGO_URI ? 'Set' : 'Missing'}`);
console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Set' : 'Missing'}`);
console.log(`🚀 PORT: ${PORT}`);

// Validate AI Configuration
console.log('🤖 Validating AI Configuration...');
const mistralApiKey = process.env.MISTRAL_API_KEY;
if (!mistralApiKey) {
  console.error('❌ MISTRAL_API_KEY not found in environment variables');
  console.error('❌ AI features will be disabled');
} else {
  console.log('✅ MISTRAL_API_KEY: Configured');
  console.log('✅ AI features: Enabled');
}

console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

// Database connection state
let dbConnectionState = {
  isConnected: false,
  retryCount: 0,
  maxRetries: 5,
  retryDelay: 5000
};

// Robust MongoDB connection with retry logic
const connectDB = async () => {
  if (dbConnectionState.isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  if (dbConnectionState.retryCount >= dbConnectionState.maxRetries) {
    console.error('❌ Max retry attempts reached. Giving up.');
    return;
  }

  try {
    console.log(`🔄 Connecting to MongoDB... (Attempt ${dbConnectionState.retryCount + 1}/${dbConnectionState.maxRetries})`);
    
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    };

    await mongoose.connect(MONGO_URI, options);
    
    dbConnectionState.isConnected = true;
    dbConnectionState.retryCount = 0;
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📍 Connected to: ${mongoose.connection.host}`);
    console.log(`🗄️ Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    dbConnectionState.retryCount++;
    console.error(`❌ MongoDB Connection Error (Attempt ${dbConnectionState.retryCount}):`, error.message);
    
    if (dbConnectionState.retryCount < dbConnectionState.maxRetries) {
      console.log(`🔄 Retrying in ${dbConnectionState.retryDelay / 1000} seconds...`);
      setTimeout(connectDB, dbConnectionState.retryDelay);
    } else {
      console.error('❌ Failed to connect to MongoDB after maximum retries');
    }
  }
};

// Database connection monitoring
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
  dbConnectionState.isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
  dbConnectionState.isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
  dbConnectionState.isConnected = false;
  // Attempt to reconnect
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
  dbConnectionState.isConnected = true;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Initialize database connection
connectDB();

// Protected middleware
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found."
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired."
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Token verification failed."
      });
    }
  }
};

// Production-ready User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  discordLink: { type: String },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  totalReviews: { type: Number, default: 0 },
  
  // Properly structured known skills
  knownSkills: [{
    skillName: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
    verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Failed'], default: 'Pending' },
    score: { type: Number, min: 0, max: 100, default: 0 },
    verifiedAt: { type: Date }
  }],
  
  // Properly structured skills to learn
  skillsToLearn: [{
    skillName: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    roadmapId: { type: String }
  }],
  
  languages: [{ type: String }],
  preferredLanguage: { type: String, default: 'English' },
  availability: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Quiz Result Schema
const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    userAnswer: { type: String, required: true }
  }],
  completedAt: { type: Date, default: Date.now }
});

// Exchange Schema
const exchangeSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredSkill: { type: String, required: true },
  requestedSkill: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Completed'], default: 'Pending' },
  ratingGiven: { type: Number, min: 1, max: 5 },
  feedbackComment: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Roadmap Schema
const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  steps: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    resources: [{ type: String }]
  }],
  generatedAt: { type: Date, default: Date.now }
});

// Create indexes for performance (remove duplicate email index)
userSchema.index({ 'knownSkills.skillName': 1 });
userSchema.index({ 'skillsToLearn.skillName': 1 });

quizResultSchema.index({ userId: 1, skillName: 1 }, { unique: true });
exchangeSchema.index({ requesterId: 1, receiverId: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
roadmapSchema.index({ userId: 1, skillName: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const QuizResult = mongoose.model("QuizResult", quizResultSchema);
const Exchange = mongoose.model("Exchange", exchangeSchema);
const Message = mongoose.model("Message", messageSchema);
const Roadmap = mongoose.model("Roadmap", roadmapSchema);

// Database status helper
const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return statusMap[state] || 'unknown';
};

// Health check route with detailed database status
app.get("/health", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const dbConnected = dbStatus === 'connected';
  
  res.json({
    success: true,
    message: "Server is healthy",
    data: {
      status: "OK",
      database: dbStatus,
      databaseConnected: dbConnected,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      connectionDetails: {
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A',
        readyState: mongoose.connection.readyState
      }
    }
  });
});

app.get("/api/health", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const dbConnected = dbStatus === 'connected';
  
  res.json({
    success: true,
    message: "Backend is healthy",
    data: {
      status: "OK",
      database: dbStatus,
      databaseConnected: dbConnected,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      connectionDetails: {
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A',
        readyState: mongoose.connection.readyState
      }
    }
  });
});

// Database test route
app.get("/api/test-db", async (req, res) => {
  try {
    // Test database connection with a simple operation
    const userCount = await User.countDocuments();
    const dbStatus = getDatabaseStatus();
    
    res.json({
      success: true,
      message: "Database test successful",
      data: {
        databaseStatus: dbStatus,
        userCount: userCount,
        connectionDetails: {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    });
  }
});

// Auth routes with database error handling
app.post("/api/auth/signup", async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }

    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required"
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { 
        token,
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt
    };
    
    res.json({
      success: true,
      message: "Login successful",
      data: { 
        token,
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Profile route
app.get("/api/auth/profile", protect, async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }
    
    // Fetch fresh user data from database to ensure skills are included
    const freshUser = await User.findById(req.user._id);
    
    if (!freshUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    console.log('📋 Profile requested for user:', freshUser.email, 'with', 
                freshUser.skillsKnown?.length || 0, 'known skills and', 
                freshUser.skillsToLearn?.length || 0, 'learning goals');
    
    res.json({
      success: true,
      message: "Profile retrieved",
      data: { user: freshUser }
    });
  } catch (error) {
    console.error('Profile error:', error);
    if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Users list endpoint
app.get('/api/users', protect, async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }

    const users = await User.find({}).select('-password');
    
    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: users
    });
  } catch (error) {
    console.error('GET /api/users error', error);
    if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// User update endpoint
app.put('/api/users/:id', protect, async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Only allow users to update their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile"
      });
    }

    // Update user in database with explicit field setting
    const updateData = {
      name: updates.name || '',
      avatar: updates.avatar || '',
      skillsKnown: updates.skillsKnown || [],
      skillsToLearn: updates.skillsToLearn || [],
      bio: updates.bio || '',
      discordLink: updates.discordLink || '',
      rating: updates.rating || 5,
      languages: updates.languages || [],
      preferredLanguage: updates.preferredLanguage || 'English',
      availability: updates.availability || []
    };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`✅ User ${id} updated successfully`);

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('PUT /api/users/:id error', error);
    if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// User get endpoint
app.get('/api/users/:id', protect, async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }

    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User retrieved successfully",
      data: { user }
    });
  } catch (error) {
    console.error('GET /api/users/:id error', error);
    if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Production-ready skill management endpoints

// Add known skill - uses $push to prevent array overwriting
app.post('/api/skills/known', protect, async (req, res) => {
  try {
    const { skillName, level = 'Beginner' } = req.body;
    const userId = req.user._id;

    if (!skillName || typeof skillName !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Skill name is required"
      });
    }

    console.log(`➕ Adding known skill "${skillName}" for user ${userId}`);

    // Check for duplicate (case-insensitive)
    const existingUser = await User.findById(userId);
    const duplicateSkill = existingUser.knownSkills.find(
      skill => skill.skillName.toLowerCase() === skillName.toLowerCase()
    );

    if (duplicateSkill) {
      return res.status(409).json({
        success: false,
        message: "Skill already exists in known skills"
      });
    }

    // Use $push to add skill without overwriting array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          knownSkills: {
            skillName,
            level,
            verificationStatus: 'Pending',
            score: 0,
            verifiedAt: null
          }
        }
      },
      { new: true, runValidators: true }
    );

    console.log(`✅ Successfully added known skill "${skillName}" for user ${userId}`);

    res.json({
      success: true,
      message: "Skill added successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('❌ Add known skill error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add skill"
    });
  }
});

// Add skill to learn - uses $push to prevent array overwriting
app.post('/api/skills/learn', protect, async (req, res) => {
  try {
    const { skillName, priority = 'Medium' } = req.body;
    const userId = req.user._id;

    if (!skillName || typeof skillName !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Skill name is required"
      });
    }

    console.log(`➕ Adding skill to learn "${skillName}" for user ${userId}`);

    // Check for duplicate (case-insensitive)
    const existingUser = await User.findById(userId);
    const duplicateSkill = existingUser.skillsToLearn.find(
      skill => skill.skillName.toLowerCase() === skillName.toLowerCase()
    );

    if (duplicateSkill) {
      return res.status(409).json({
        success: false,
        message: "Skill already exists in learning goals"
      });
    }

    // Use $push to add skill without overwriting array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          skillsToLearn: {
            skillName,
            priority,
            roadmapId: null
          }
        }
      },
      { new: true, runValidators: true }
    );

    console.log(`✅ Successfully added skill to learn "${skillName}" for user ${userId}`);

    res.json({
      success: true,
      message: "Learning goal added successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('❌ Add skill to learn error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add learning goal"
    });
  }
});

// Remove known skill - uses $pull to remove specific skill
app.delete('/api/skills/known/:skillName', protect, async (req, res) => {
  try {
    const { skillName } = req.params;
    const userId = req.user._id;

    console.log(`Removing known skill "${skillName}" for user ${userId}`);

    // Use $pull to remove specific skill without overwriting array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          knownSkills: { skillName }
        }
      },
      { new: true, runValidators: true }
    );

    console.log(`✅ Successfully removed known skill "${skillName}" for user ${userId}`);

    res.json({
      success: true,
      message: "Skill removed successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('❌ Remove known skill error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to remove skill"
    });
  }
});

// Remove skill to learn - uses $pull to remove specific skill
app.delete('/api/skills/learn/:skillName', protect, async (req, res) => {
  try {
    const { skillName } = req.params;
    const userId = req.user._id;

    console.log(`➖ Removing skill to learn "${skillName}" for user ${userId}`);

    // Use $pull to remove specific skill without overwriting array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          skillsToLearn: { skillName }
        }
      },
      { new: true, runValidators: true }
    );

    console.log(`✅ Successfully removed skill to learn "${skillName}" for user ${userId}`);

    res.json({
      success: true,
      message: "Learning goal removed successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('❌ Remove skill to learn error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to remove learning goal"
    });
  }
});

// Enhanced profile endpoint - always returns latest DB data
app.get('/api/user/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📋 Fetching fresh profile for user ${userId}`);

    const freshUser = await User.findById(userId);
    
    if (!freshUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`📊 Profile data: ${freshUser.knownSkills.length} known skills, ${freshUser.skillsToLearn.length} learning goals`);

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { user: freshUser }
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
});

// Quiz generation endpoint - GET version for testing
app.get('/api/quiz', protect, async (req, res) => {
  try {
    const { skill, difficulty = 'medium' } = req.query;

    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Skill parameter is required"
      });
    }

    console.log(`🎯 GET Generating dynamic AI quiz for skill: ${skill} (difficulty: ${difficulty})`);

    // Validate environment
    if (!process.env.MISTRAL_API_KEY) {
      console.error('❌ MISTRAL_API_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        message: "Quiz generation service not configured properly."
      });
    }

    // Generate dynamic quiz questions using AI
    const quizQuestions = await generateDynamicQuizQuestions(skill, difficulty);

    // Validate quiz questions
    if (!quizQuestions || quizQuestions.length === 0) {
      console.error('❌ No questions generated from AI');
      return res.status(500).json({
        success: false,
        message: "Quiz generation failed. Please try again."
      });
    }

    console.log(`✅ Generated ${quizQuestions.length} dynamic quiz questions for ${skill}`);

    res.json({
      success: true,
      skill: skill,
      questions: quizQuestions
    });

  } catch (error) {
    console.error('❌ Quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: "Quiz generation failed. Please try again."
    });
  }
});

// Quiz generation endpoint - 100% Dynamic AI-based
app.post('/quiz/generate', protect, async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again later."
      });
    }

    const { skill, difficulty = 'medium' } = req.body;

    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Skill name is required"
      });
    }

    console.log(`🎯 Generating dynamic AI quiz for skill: ${skill} (difficulty: ${difficulty})`);

    // Validate environment
    if (!process.env.MISTRAL_API_KEY) {
      console.error('❌ MISTRAL_API_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        message: "Quiz generation service not configured properly."
      });
    }

    // Generate dynamic quiz questions using AI
    const quizQuestions = await generateDynamicQuizQuestions(skill, difficulty);

    // Validate quiz questions
    if (!quizQuestions || quizQuestions.length === 0) {
      console.error('❌ No questions generated from AI');
      return res.status(500).json({
        success: false,
        message: "Quiz generation failed. Please try again."
      });
    }

    console.log(`✅ Generated ${quizQuestions.length} dynamic quiz questions for ${skill}`);

    res.json({
      success: true,
      skill: skill,
      questions: quizQuestions
    });

  } catch (error) {
    console.error('❌ Quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: "Quiz generation failed. Please try again."
    });
  }
});

// Dynamic AI Quiz Generation - 100% Skill-specific
async function generateDynamicQuizQuestions(skill, difficulty = 'medium', questionCount = 5) {
  // Validate AI Configuration
  const mistralApiKey = process.env.MISTRAL_API_KEY;
  if (!mistralApiKey) {
    throw new Error("AI features are not available - MISTRAL_API_KEY not configured");
  }

  const maxRetries = 3;
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      console.log(`🤖 AI Quiz Generation Attempt ${attempt}/${maxRetries} for ${skill}`);
      
      // Strict AI prompt for JSON-only output
      const prompt = `Generate exactly ${questionCount} multiple-choice questions about ${skill} at ${difficulty} level.

You MUST return ONLY valid JSON. Do NOT include explanations. Do NOT include markdown. Return exactly this structure:

{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A"
    }
  ]
}

Requirements:
- All questions must be specifically about ${skill}
- Options must be realistic but clearly distinguishable
- correctAnswer must match one of the options exactly
- Questions must be appropriate for ${difficulty} level`;

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-tiny',
          messages: [
            {
              role: 'system',
              content: 'You MUST return ONLY valid JSON. No explanations, no markdown, just JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
      }

      const rawResponse = await response.text();
      console.log('📥 Raw AI Response:', rawResponse);

      // Extract JSON safely
      let jsonResponse;
      try {
        // Parse the response as JSON first
        const fullResponse = JSON.parse(rawResponse);
        console.log('📊 Full Parsed Response:', fullResponse);
        
        // Extract the content from Mistral's response structure
        if (fullResponse.choices && fullResponse.choices[0] && fullResponse.choices[0].message) {
          const content = fullResponse.choices[0].message.content;
          console.log('📝 AI Content:', content);
          
          // Find JSON in the content (in case there's extra text)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON found in AI response content');
          }
          
          jsonResponse = JSON.parse(jsonMatch[0]);
          console.log('📊 Parsed JSON Response:', jsonResponse);
        } else {
          throw new Error('Invalid response structure from Mistral API');
        }
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error(`Invalid JSON from AI: ${parseError.message}`);
      }

      // Validate response structure
      if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
        throw new Error('Missing or invalid questions array in AI response');
      }

      if (jsonResponse.questions.length === 0) {
        throw new Error('Empty questions array returned from AI');
      }

      // Validate each question
      const validatedQuestions = jsonResponse.questions.map((q, index) => {
        if (!q.question || typeof q.question !== 'string') {
          throw new Error(`Question ${index + 1}: Missing or invalid question text`);
        }
        
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question ${index + 1}: Must have exactly 4 options`);
        }
        
        if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
          throw new Error(`Question ${index + 1}: Missing or invalid correctAnswer`);
        }
        
        // Find the correct answer index (A=0, B=1, C=2, D=3)
        const answerMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const correctIndex = answerMap[q.correctAnswer];
        
        if (correctIndex === undefined || correctIndex < 0 || correctIndex >= 4) {
          throw new Error(`Question ${index + 1}: correctAnswer must be A, B, C, or D`);
        }

        // Convert to frontend format
        return {
          id: `q_${index + 1}`,
          question: q.question,
          options: q.options,
          correct: correctIndex,
          explanation: `This question tests your knowledge of ${skill}.`
        };
      });

      console.log(`✅ Successfully generated and validated ${validatedQuestions.length} questions`);
      return validatedQuestions;

    } catch (error) {
      console.error(`❌ Quiz generation attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Quiz generation failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Quiz Result Storage - PHASE 4
app.post('/api/quiz/result', protect, async (req, res) => {
  try {
    const { skillName, score, questions, level } = req.body;
    const userId = req.user._id;

    if (!skillName || typeof score !== 'number' || !questions) {
      return res.status(400).json({
        success: false,
        message: "Skill name, score, and questions are required"
      });
    }

    // Map score to level
    let calculatedLevel = 'Beginner';
    if (score >= 80) calculatedLevel = 'Expert';
    else if (score >= 60) calculatedLevel = 'Advanced';
    else if (score >= 40) calculatedLevel = 'Intermediate';

    console.log(`💾 Storing quiz result for ${skillName} - Score: ${score}%, Level: ${calculatedLevel}`);

    // Use upsert for retakes - one quiz per user-skill pair
    const quizResult = await QuizResult.findOneAndUpdate(
      { userId, skillName },
      {
        userId,
        skillName,
        score,
        level: level || calculatedLevel,
        questions,
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update user's known skill verification status
    await User.findOneAndUpdate(
      { 
        _id: userId,
        'knownSkills.skillName': skillName
      },
      { 
        $set: { 
          'knownSkills.$.verificationStatus': score >= 60 ? 'Verified' : 'Failed',
          'knownSkills.$.score': score,
          'knownSkills.$.verifiedAt': new Date(),
          'knownSkills.$.level': calculatedLevel
        }
      }
    );

    console.log(`✅ Quiz result stored and skill updated for ${skillName}`);

    res.json({
      success: true,
      message: "Quiz result saved successfully",
      data: { 
        quizResult,
        level: calculatedLevel,
        passed: score >= 60
      }
    });

  } catch (error) {
    console.error('❌ Quiz result storage error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to save quiz result"
    });
  }
});

// Get quiz results for a user
app.get('/api/quiz/results', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const results = await QuizResult.find({ userId }).sort({ completedAt: -1 });

    console.log(`📊 Retrieved ${results.length} quiz results for user ${userId}`);

    res.json({
      success: true,
      message: "Quiz results retrieved successfully",
      data: { results }
    });

  } catch (error) {
    console.error('❌ Quiz results fetch error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quiz results"
    });
  }
});

// Remove old static template function - NO FALLBACKS ALLOWED

// Root route
app.get("/", (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    success: true,
    message: "SkillVouch AI Backend API",
    data: {
      version: "1.0.0",
      status: "running",
      database: dbStatus,
      endpoints: ["/health", "/api/health", "/api/test-db", "/api/auth/signup", "/api/auth/login", "/api/auth/profile", "/api/users", "/api/users/:id", "/api/user/profile", "/api/skills/known", "/api/skills/learn", "/quiz/generate", "/api/quiz"]
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// ==================== MESSAGING SYSTEM ====================

// Get all conversations for a user
app.get('/api/messages/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[API] GET /api/messages/conversations - User: ${userId}`);
    
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      {
        $unwind: '$otherUser'
      }
    ]);

    console.log(`[API] GET /api/messages/conversations - User: ${userId} - 200 OK (${conversations.length} conversations)`);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error(`[API] GET /api/messages/conversations - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
});

// Get conversation between two users
app.get('/api/messages/conversation', protect, async (req, res) => {
  try {
    const { user1Id, user2Id } = req.query;
    const userId = req.user._id;
    
    console.log(`[API] GET /api/messages/conversation - User: ${userId} - With: ${user2Id}`);
    
    // Verify user is part of the conversation
    if (userId !== user1Id && userId !== user2Id) {
      console.log(`[API] GET /api/messages/conversation - User: ${userId} - 403 FORBIDDEN`);
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const messages = await Message.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ createdAt: 1 });

    console.log(`[API] GET /api/messages/conversation - User: ${userId} - 200 OK (${messages.length} messages)`);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error(`[API] GET /api/messages/conversation - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation"
    });
  }
});

// Send a message
app.post('/api/messages/send', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;
    
    console.log(`[API] POST /api/messages/send - User: ${senderId} - To: ${receiverId}`);
    
    const message = new Message({
      senderId,
      receiverId,
      content,
      createdAt: new Date()
    });
    
    await message.save();
    
    console.log(`[API] POST /api/messages/send - User: ${senderId} - 201 OK`);
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error(`[API] POST /api/messages/send - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
});

// Legacy route for compatibility
app.post('/api/messages', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;
    
    console.log(`[API] POST /api/messages - User: ${senderId} - To: ${receiverId}`);
    
    const message = new Message({
      senderId,
      receiverId,
      content,
      createdAt: new Date()
    });
    
    await message.save();
    
    console.log(`[API] POST /api/messages - User: ${senderId} - 201 OK`);
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error(`[API] POST /api/messages - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
});

// Get unread message count
app.get('/api/messages/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`[API] GET /api/messages/unread-count - User: ${userId}`);
    
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false
    });

    console.log(`[API] GET /api/messages/unread-count - User: ${userId} - 200 OK (${unreadCount} unread)`);
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error(`[API] GET /api/messages/unread-count - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count"
    });
  }
});

// Mark messages as read
app.post('/api/messages/mark-as-read', protect, async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] POST /api/messages/mark-as-read - User: ${userId} - From: ${senderId}`);
    
    await Message.updateMany(
      {
        senderId,
        receiverId: userId,
        isRead: false
      },
      { isRead: true }
    );

    console.log(`[API] POST /api/messages/mark-as-read - User: ${userId} - 200 OK`);
    
    res.json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    console.error(`[API] POST /api/messages/mark-as-read - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read"
    });
  }
});

// Get conversations (alias for consistency)
app.get('/api/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[API] GET /api/conversations - User: ${userId}`);
    
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      {
        $unwind: '$otherUser'
      }
    ]);

    console.log(`[API] GET /api/conversations - User: ${userId} - 200 OK (${conversations.length} conversations)`);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error(`[API] GET /api/conversations - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
});

// Legacy route for compatibility
app.get('/api/messages/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    console.log(`[API] GET /api/messages/${userId} - User: ${currentUserId}`);
    
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    console.log(`[API] GET /api/messages/${userId} - User: ${currentUserId} - 200 OK (${messages.length} messages)`);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error(`[API] GET /api/messages/${userId} - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
});

// ==================== EXCHANGE SYSTEM ====================

// Create exchange request
app.post('/api/requests', protect, async (req, res) => {
  try {
    const exchangeData = req.body;
    const requesterId = req.user._id;
    
    console.log(`[API] POST /api/requests - User: ${requesterId}`);
    
    const exchange = new Exchange({
      ...exchangeData,
      requesterId,
      status: 'pending',
      createdAt: new Date()
    });
    
    await exchange.save();
    
    console.log(`[API] POST /api/requests - User: ${requesterId} - 201 OK`);
    
    res.status(201).json({
      success: true,
      data: exchange
    });
  } catch (error) {
    console.error(`[API] POST /api/requests - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to create exchange request"
    });
  }
});

// Get exchange requests for user
app.get('/api/requests', protect, async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = req.user._id;
    
    console.log(`[API] GET /api/requests - User: ${currentUserId}`);
    
    const requests = await Exchange.find({
      $or: [
        { requesterId: userId || currentUserId },
        { receiverId: userId || currentUserId }
      ]
    }).populate('requesterId receiverId');

    console.log(`[API] GET /api/requests - User: ${currentUserId} - 200 OK (${requests.length} requests)`);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error(`[API] GET /api/requests - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exchange requests"
    });
  }
});

// Update exchange request status
app.put('/api/requests/:id/status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] PUT /api/requests/${id}/status - User: ${userId} - Status: ${status}`);
    
    const exchange = await Exchange.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!exchange) {
      console.log(`[API] PUT /api/requests/${id}/status - User: ${userId} - 404 NOT FOUND`);
      return res.status(404).json({
        success: false,
        message: "Exchange request not found"
      });
    }

    console.log(`[API] PUT /api/requests/${id}/status - User: ${userId} - 200 OK`);
    
    res.json({
      success: true,
      data: exchange
    });
  } catch (error) {
    console.error(`[API] PUT /api/requests/${id}/status - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to update exchange request"
    });
  }
});

// ==================== FEEDBACK SYSTEM ====================

// Submit feedback
app.post('/api/feedback', protect, async (req, res) => {
  try {
    const feedbackData = req.body;
    const fromUserId = req.user._id;
    
    console.log(`[API] POST /api/feedback - User: ${fromUserId}`);
    
    const feedback = {
      ...feedbackData,
      fromUserId,
      createdAt: new Date()
    };
    
    // For now, store in exchange (can be extended to separate feedback collection)
    await Exchange.findByIdAndUpdate(
      feedbackData.exchangeId,
      { $push: { feedback } }
    );
    
    console.log(`[API] POST /api/feedback - User: ${fromUserId} - 201 OK`);
    
    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error(`[API] POST /api/feedback - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback"
    });
  }
});

// Get received feedback
app.get('/api/feedback/received', protect, async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = req.user._id;
    
    console.log(`[API] GET /api/feedback/received - User: ${currentUserId}`);
    
    const feedback = await Exchange.find({
      receiverId: userId || currentUserId,
      feedback: { $exists: true, $ne: [] }
    }).select('feedback');

    console.log(`[API] GET /api/feedback/received - User: ${currentUserId} - 200 OK`);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error(`[API] GET /api/feedback/received - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback"
    });
  }
});

// Get feedback stats
app.get('/api/feedback/stats', protect, async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = req.user._id;
    
    console.log(`[API] GET /api/feedback/stats - User: ${currentUserId}`);
    
    // Simple stats - can be enhanced
    const stats = {
      totalExchanges: 0,
      completedExchanges: 0,
      averageRating: 0
    };
    
    console.log(`[API] GET /api/feedback/stats - User: ${currentUserId} - 200 OK`);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(`[API] GET /api/feedback/stats - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback stats"
    });
  }
});

// ==================== AI ENDPOINTS ====================

// AI Quiz Generation (Mistral)
app.post('/api/mistral/generate-quiz', protect, async (req, res) => {
  try {
    // Validate AI Configuration
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      console.log(`[AI] Quiz generation blocked - User: ${req.user._id} - MISTRAL_API_KEY not configured`);
      return res.status(503).json({
        success: false,
        message: "AI features are not available - API key not configured"
      });
    }

    const { skill, difficulty, questionCount = 5 } = req.body;
    const userId = req.user._id;
    
    console.log(`[AI] Quiz generation triggered - Skill: ${skill} - Difficulty: ${difficulty}`);
    
    const questions = await generateDynamicQuizQuestions(skill, difficulty, questionCount);
    
    console.log(`[AI] Model response parsed successfully - ${questions.length} questions generated`);
    
    res.json({
      success: true,
      data: {
        skill,
        difficulty,
        questions
      }
    });
  } catch (error) {
    console.error(`[AI] Quiz generation failed - User: ${req.user._id} - ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate quiz"
    });
  }
});

// Peer Recommendations
app.post('/api/peer-recommendations', protect, async (req, res) => {
  try {
    const { skills, preferences } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] POST /api/peer-recommendations - User: ${userId}`);
    
    // Simple recommendation logic - can be enhanced with AI
    const users = await User.find({
      _id: { $ne: userId },
      'knownSkills.skillName': { $in: skills }
    }).select('name email avatar knownSkills rating').limit(10);

    console.log(`[API] POST /api/peer-recommendations - User: ${userId} - 200 OK (${users.length} recommendations)`);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error(`[API] POST /api/peer-recommendations - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get peer recommendations"
    });
  }
});

// Skill Suggestions
app.post('/api/skills/suggest', protect, async (req, res) => {
  try {
    const { userSkills, preferences } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] POST /api/skills/suggest - User: ${userId}`);
    
    // Simple skill suggestions - can be enhanced with AI
    const suggestions = [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
      'Docker', 'AWS', 'MongoDB', 'PostgreSQL', 'GraphQL'
    ].filter(skill => !userSkills.includes(skill));

    console.log(`[API] POST /api/skills/suggest - User: ${userId} - 200 OK (${suggestions.length} suggestions)`);
    
    res.json({
      success: true,
      data: { skills: suggestions }
    });
  } catch (error) {
    console.error(`[API] POST /api/skills/suggest - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get skill suggestions"
    });
  }
});

// Roadmap Generation
app.post('/api/roadmap/generate', protect, async (req, res) => {
  try {
    const { skill, currentLevel, targetLevel } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] POST /api/roadmap/generate - User: ${userId} - Skill: ${skill}`);
    
    // Simple roadmap - can be enhanced with AI
    const roadmap = {
      skill,
      steps: [
        { title: `Learn ${skill} basics`, duration: '2-4 weeks' },
        { title: `Practice ${skill} projects`, duration: '4-6 weeks' },
        { title: `Advanced ${skill} concepts`, duration: '6-8 weeks' }
      ]
    };

    console.log(`[API] POST /api/roadmap/generate - User: ${userId} - 200 OK`);
    
    res.json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error(`[API] POST /api/roadmap/generate - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate roadmap"
    });
  }
});

// Learning Roadmap
app.get('/api/learning/roadmap', protect, async (req, res) => {
  try {
    const { skill } = req.query;
    const userId = req.user._id;
    
    console.log(`[API] GET /api/learning/roadmap - User: ${userId} - Skill: ${skill}`);
    
    const roadmap = await Roadmap.findOne({ userId, skillName: skill });
    
    console.log(`[API] GET /api/learning/roadmap - User: ${userId} - 200 OK`);
    
    res.json({
      success: true,
      data: roadmap || { steps: [] }
    });
  } catch (error) {
    console.error(`[API] GET /api/learning/roadmap - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch learning roadmap"
    });
  }
});

// AI SQL Query (placeholder)
app.post('/api/ai-sql-query', protect, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] POST /api/ai-sql-query - User: ${userId}`);
    
    // Placeholder for AI SQL query generation
    res.json({
      success: true,
      data: { sql: "SELECT * FROM users WHERE active = true" }
    });
  } catch (error) {
    console.error(`[API] POST /api/ai-sql-query - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate SQL query"
    });
  }
});

// Execute SQL (placeholder)
app.post('/api/execute-sql', protect, async (req, res) => {
  try {
    const { sql } = req.body;
    const userId = req.user._id;
    
    console.log(`[API] POST /api/execute-sql - User: ${userId}`);
    
    // Placeholder for SQL execution
    res.json({
      success: true,
      data: { results: [], message: "SQL execution not implemented in production" }
    });
  } catch (error) {
    console.error(`[API] POST /api/execute-sql - User: ${req.user._id} - 500 ERROR:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to execute SQL"
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`[API] ${req.method} ${req.originalUrl} - 404 NOT FOUND`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Database: ${getDatabaseStatus()}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Database test: http://localhost:${PORT}/api/test-db`);
});

export default app;
