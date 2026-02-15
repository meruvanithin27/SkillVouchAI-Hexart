# 🚀 Vercel Environment Variables Setup Guide

## Required Environment Variables

### 1. MongoDB Configuration
**Variable Name**: `MONGODB_URI`
**Value**: `mongodb+srv://username:password@cluster.mongodb.net/skillvouch?retryWrites=true&w=majority`

**Steps**:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Connect" → "Drivers"
3. Copy the connection string
4. Replace `<username>` and `<password>` with your database credentials
5. **Important**: URL encode special characters in password (e.g., `@` → `%40`, `:` → `%3A`)
6. Set the variable in Vercel

### 2. JWT Secret
**Variable Name**: `JWT_SECRET`
**Value**: Generate a random 32+ character string

**Generate with**:
```bash
openssl rand -base64 32
```

### 3. Node Environment
**Variable Name**: `NODE_ENV`
**Value**: `production`

### 4. Port Configuration
**Variable Name**: `PORT`
**Value**: `3000`

### 5. Mistral AI API Key
**Variable Name**: `MISTRAL_API_KEY`
**Value**: Your Mistral API key

## Vercel Setup Steps

### 1. Go to Vercel Dashboard
- Navigate to your project
- Go to "Settings" → "Environment Variables"

### 2. Add Environment Variables
For each variable:
1. Click "Add New"
2. Enter the **Variable Name** exactly as shown above
3. Enter the **Value**
4. Select **Production**, **Preview**, and **Development** environments
5. Click "Save"

### 3. Redeploy
After adding all variables:
1. Go to "Deployments"
2. Click "Redeploy" or push a new commit

## 🔍 Verification

After deployment, check:
1. **MongoDB Connection**: Logs should show "✅ Connected"
2. **API Endpoints**: Test `/api/` endpoint
3. **Authentication**: Try signup/login

## ⚠️ Common Issues

### MongoDB Connection Failed
- Check if MONGODB_URI is correct
- Ensure IP whitelist includes `0.0.0.0/0`
- Verify database user has correct permissions

### JWT Issues
- Ensure JWT_SECRET is at least 32 characters
- Don't use quotes around the value

### Build Errors
- Ensure all required variables are set
- Check for typos in variable names

## 🧪 Testing Commands

```bash
# Test API endpoint
curl https://your-app.vercel.app/api/

# Test MongoDB connection (check logs)
# Test signup
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 📝 Environment Variable Checklist

- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - JWT signing secret (32+ chars)
- [ ] `NODE_ENV` - Set to "production"
- [ ] `PORT` - Set to "3000"
- [ ] `MISTRAL_API_KEY` - Mistral AI API key

**All variables should be added to Production, Preview, and Development environments.**
