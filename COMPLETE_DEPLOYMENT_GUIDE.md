# 🚀 Complete MERN Deployment Guide - Render + Vercel

## 📋 FINAL CHECKLIST

### ✅ BACKEND (Render) Configuration
- **Root Directory**: `Backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Port**: `10000`

### ✅ Environment Variables for Render
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillvouch?retryWrites=true&w=majority
JWT_SECRET=sQQTP8UgvUDMaorbj4P1aRIcbAyA2uun0o1FV+YdLKM=
MISTRAL_API_KEY=your-mistral-api-key
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
PORT=10000
```

### ✅ FRONTEND (Vercel) Configuration
- **Root Directory**: `Frontend`
- **Framework**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### ✅ Environment Variables for Vercel
```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🔧 STEP 1: DEPLOY BACKEND ON RENDER

### 1.1 Create Web Service
1. Go to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect: `meruvanithin27/SkillVouchAI-Hexart`
4. **Root Directory**: `Backend`
5. **Environment**: `Node`
6. **Plan**: `Free`

### 1.2 Configure Service
```
Name: skillvouch-backend
Build Command: npm install
Start Command: node server.js
```

### 1.3 Add Environment Variables
Add these in Render Dashboard:
```bash
MONGODB_URI=mongodb+srv://skillvouch-user:YOUR_PASSWORD@skillvouch-cluster.xxxxx.mongodb.net/skillvouch?retryWrites=true&w=majority
JWT_SECRET=sQQTP8UgvUDMaorbj4P1aRIcbAyA2uun0o1FV+YdLKM=
MISTRAL_API_KEY=your-mistral-api-key
FRONTEND_URL=https://skillvouch-ai-frontend.vercel.app
NODE_ENV=production
PORT=10000
```

### 1.4 Deploy
Click "Create Web Service" and wait for deployment.

---

## 🔧 STEP 2: DEPLOY FRONTEND ON VERCEL

### 2.1 Create Project
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import: `meruvanithin27/SkillVouchAI-Hexart`
4. **Root Directory**: `Frontend`
5. **Framework**: `Vite`

### 2.2 Add Environment Variable
```bash
VITE_API_URL=https://your-backend-name.onrender.com
```

### 2.3 Deploy
Click "Deploy" and wait for deployment.

---

## 🧪 STEP 3: TEST INTEGRATION

### 3.1 Test Backend
```bash
# Test health endpoint
curl https://your-backend.onrender.com/

# Test auth endpoint
curl https://your-backend.onrender.com/api/auth/test
```

### 3.2 Test Frontend
1. Open your Vercel URL
2. Try signup with:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
3. Try login with same credentials

### 3.3 Check Browser Console
- No CORS errors
- No "Failed to fetch" errors
- API calls show 200 status
- JWT token stored in localStorage

---

## 🔧 TROUBLESHOOTING

### Backend Issues
- **Build fails**: Check package.json has all dependencies
- **Database fails**: Verify MONGODB_URI format and network access
- **CORS errors**: Check FRONTEND_URL environment variable

### Frontend Issues
- **Build fails**: Check Vite configuration and dependencies
- **API fails**: Verify VITE_API_URL is correct
- **CORS errors**: Backend might still be starting (wait 2-3 minutes)

### Integration Issues
- **"Failed to fetch"**: Check environment variables in both platforms
- **CORS errors**: Ensure FRONTEND_URL is set in Render
- **JWT errors**: Verify JWT_SECRET is set in Render

---

## 📱 EXPECTED RESULTS

### ✅ Working Features
- User signup without "string pattern" errors
- User login with JWT authentication
- Frontend connects to backend seamlessly
- MongoDB Atlas integration working
- CORS properly configured
- Environment variables working

### ✅ URLs Structure
```
Backend: https://your-backend.onrender.com
Frontend: https://your-frontend.vercel.app
API Endpoints: https://your-backend.onrender.com/api/auth/*
```

### ✅ Authentication Flow
1. User signs up → JWT token generated
2. Token stored in localStorage
3. All API calls include Bearer token
4. Backend validates JWT for protected routes

---

## 🔄 AUTO-DEPLOYMENT

Both platforms configured for auto-deploy:
- **Render**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

Future GitHub changes will automatically deploy to both platforms!

---

## 🎯 SUCCESS INDICATORS

✅ Backend responds to `/api/auth/test`  
✅ Frontend loads without console errors  
✅ Signup creates user in MongoDB  
✅ Login returns JWT token  
✅ API calls show 200 status in Network tab  
✅ No CORS or "Failed to fetch" errors  
✅ JWT token stored in localStorage  

**Your MERN application is now production-ready! 🚀**
