# 🚀 Vercel Frontend Deployment Guide

## Prerequisites
- Backend deployed on Render and working
- Your Render backend URL (e.g., https://skillvouch-backend.onrender.com)

## Step 1: Deploy to Vercel

### 1.1 Go to Vercel
1. Go to [Vercel](https://vercel.com)
2. Click **"New Project"**

### 1.2 Import Repository
1. **Import Git Repository**: 
   - Select `meruvanithin27/SkillVouchAI-Hexart`
   - Branch: `main`

### 1.3 Configure Project
```
Project Name: skillvouch-ai-frontend
Framework Preset: Vite
Root Directory: Frontend
```

### 1.4 Environment Variables
Add this environment variable:

#### Required Variable:
- **NEXT_PUBLIC_API_URL**: Your Render backend URL + `/api`

**Example:**
```
NEXT_PUBLIC_API_URL=https://skillvouch-backend.onrender.com/api
```

**Important:**
- Must start with `NEXT_PUBLIC_` for frontend access
- Use your actual Render backend URL
- Include `/api` at the end

### 1.5 Build Settings
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 1.6 Deploy
Click **"Deploy"**

## Step 2: Wait for Deployment
- Vercel will automatically build and deploy
- Takes 2-3 minutes
- You'll get a URL like: `https://skillvouch-ai-frontend.vercel.app`

## Step 3: Test Frontend
1. Open your Vercel URL
2. Try signing up: 
   - Click "Sign Up"
   - Fill form and submit
   - Should work without "string pattern" errors
3. Try logging in with created credentials

## 🔧 CORS Configuration

The backend already has CORS configured for all origins:
```javascript
app.use(cors({ origin: true }));
```

If you get CORS errors, the backend might still be deploying. Wait 2-3 minutes after backend deployment.

## 📱 Testing Full Integration

### Test Signup Flow:
1. Go to your Vercel frontend
2. Click "Sign Up"
3. Fill: 
   - Name: Test User
   - Email: test@example.com  
   - Password: password123
   - Confirm: password123
4. Click "Sign Up"
5. Should redirect to login with success message

### Test Login Flow:
1. Click "Login"
2. Use same credentials
3. Should redirect to dashboard

## 🌐 URLs Structure

**Backend (Render):**
```
https://skillvouch-backend.onrender.com/api/auth/signup
https://skillvouch-backend.onrender.com/api/auth/login
https://skillvouch-backend.onrender.com/api/
```

**Frontend (Vercel):**
```
https://skillvouch-ai-frontend.vercel.app
```

## 🔧 Troubleshooting

### "Network Error" or CORS Issues
- Backend might still be deploying (wait 2-3 minutes)
- Check NEXT_PUBLIC_API_URL is correct
- Verify backend is working: `curl https://your-backend.onrender.com/api`

### Build Fails
- Check Frontend/package.json has correct scripts
- Verify vercel.json configuration
- Check build logs for errors

### Signup/Login Not Working
- Check browser console for errors
- Verify backend environment variables
- Check network tab for failed requests

### "String pattern" Error
- This should be fixed now with JavaScript validation
- If still occurs, check browser console for specific errors

## 📊 Expected Results

After successful deployment:
- ✅ Frontend loads without errors
- ✅ Signup works without validation errors
- ✅ Login redirects to dashboard
- ✅ API calls succeed (check browser network tab)
- ✅ No "string pattern" errors

## 🎯 Final Verification

Test these URLs in your browser:
1. Frontend: `https://your-app.vercel.app`
2. Backend Health: `https://your-backend.onrender.com/api`
3. Backend Signup: `https://your-backend.onrender.com/api/auth/signup`

**Your full-stack application is now live! 🎉**

## 🔄 Auto-Deploy Configuration

Both platforms are configured for auto-deploy:
- **Render**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

Future changes to GitHub will automatically deploy to both platforms!
