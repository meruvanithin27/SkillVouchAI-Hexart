import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// Trust proxy for production (Render)
app.set('trust proxy', true);

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
  origin: ["https://skillvouch-hexart.vercel.app", "https://skillvouch-hexart2026.vercel.app", "http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Environment variables with fallbacks
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://meruvanithinkumarreddy_db_user:k6UWfK6UewtlZX44@cluster0.imqsaat.mongodb.net/skillvouch?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || "sQQTP8UgvUDMaorbj4P1aRIcbAyA2uun0o1FV+YdLKM=";
const PORT = process.env.PORT || 5000;

console.log('🔧 Starting server with configuration:');
console.log(`🔗 MongoDB URI: ${MONGO_URI ? 'Set' : 'Missing'}`);
console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Set' : 'Missing'}`);
console.log(`🚀 PORT: ${PORT}`);

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

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

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

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
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
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
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
    
    res.json({
      success: true,
      message: "Profile retrieved",
      data: { user: req.user }
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

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
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
      endpoints: ["/health", "/api/health", "/api/test-db", "/api/auth/signup", "/api/auth/login", "/api/auth/profile", "/api/users", "/api/users/:id"]
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
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
