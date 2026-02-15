import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: ["https://skillvouch-hexart.vercel.app", "http://localhost:3000", "http://localhost:5173"],
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

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    // Don't exit, continue with limited functionality
  });

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    data: {
      status: "OK",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    data: {
      status: "OK",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

// Auth routes
app.post("/api/auth/signup", async (req, res) => {
  try {
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
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { token }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
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
    
    res.json({
      success: true,
      message: "Login successful",
      data: { token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Profile route
app.get("/api/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "Profile retrieved",
      data: { user }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
});

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SkillVouch AI Backend API",
    data: {
      version: "1.0.0",
      status: "running",
      endpoints: ["/health", "/api/health", "/api/auth/signup", "/api/auth/login", "/api/auth/profile"]
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
  console.log(`🔗 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
