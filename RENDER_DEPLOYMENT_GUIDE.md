# 🚀 Render Backend Deployment Guide

## Step 1: Prepare Your Repository
Your repository is already ready with the necessary files!

## Step 2: Deploy to Render

### 2.1 Sign Up/Login to Render
1. Go to [Render](https://render.com)
2. Sign up with GitHub (recommended)

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: 
   - Select `meruvanithin27/SkillVouchAI-Hexart`
   - Branch: `main`
   - Root Directory: `Backend`

### 2.3 Configure Service
```
Name: skillvouch-backend
Environment: Node
Region: Choose nearest (e.g., Oregon)
Plan: Free
```

### 2.4 Build Settings
```
Build Command: npm install
Start Command: npm start
```

### 2.5 Environment Variables
Add these environment variables:

#### Required Variables:
- **NODE_ENV**: `production`
- **PORT**: `10000` (Render's default)
- **MONGODB_URI**: Your MongoDB connection string
- **JWT_SECRET**: `sQQTP8UgvUDMaorbj4P1aRIcbAyA2uun0o1FV+YdLKM=`
- **MISTRAL_API_KEY**: Your Mistral API key

#### MongoDB URI Format:
```
mongodb+srv://skillvouch-user:YOUR_PASSWORD@skillvouch-cluster.xxxxx.mongodb.net/skillvouch?retryWrites=true&w=majority
```

### 2.6 Advanced Settings
```
Health Check Path: /api
Auto-Deploy: Yes
```

### 2.7 Create Service
Click **"Create Web Service"**

## Step 3: Wait for Deployment
- Render will automatically build and deploy
- Takes 2-5 minutes
- Check the logs for any errors

## Step 4: Get Your Backend URL
Once deployed, you'll get a URL like:
```
https://skillvouch-backend.onrender.com
```

## Step 5: Test Backend
Test these endpoints:
```bash
# Health check
curl https://skillvouch-backend.onrender.com/api

# Test signup
curl -X POST https://skillvouch-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 🔧 Troubleshooting

### Build Fails
- Check `package.json` has correct scripts
- Verify all dependencies are in package.json
- Check logs for specific error messages

### Database Connection Failed
- Verify MONGODB_URI is correct
- Check MongoDB Atlas network access (0.0.0.0/0)
- Ensure password is URL-encoded

### Service Not Starting
- Check PORT is set to 10000
- Verify start command is `npm start`
- Check for syntax errors in server.js

## 📊 Expected Logs
Successful deployment shows:
```
🔍 Environment Variables Check:
✅ NODE_ENV: production
✅ PORT: 10000
✅ MONGODB_URI: Set
✅ JWT_SECRET: Set
🔗 Connecting to MongoDB...
✅ MongoDB connected successfully
🚀 MongoDB backend listening on port 10000
```

## 🌐 Next Steps
After backend is deployed:
1. Copy your Render URL
2. Update frontend API configuration
3. Deploy frontend to Vercel
4. Test full integration

**Your backend will be available at: https://skillvouch-backend.onrender.com**
