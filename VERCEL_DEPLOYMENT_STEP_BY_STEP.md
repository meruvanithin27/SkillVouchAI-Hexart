# 🚀 Vercel Frontend Deployment - Step by Step

## 🎯 Your Configuration
- **Backend URL**: `https://skillvouchai-hexart.onrender.com`
- **Frontend Environment Variable**: `NEXT_PUBLIC_API_URL=https://skillvouchai-hexart.onrender.com/api`

## 📋 Step-by-Step Instructions

### Step 1: Go to Vercel
1. **Visit**: [https://vercel.com](https://vercel.com)
2. **Login** with your GitHub account
3. **Click**: "New Project" (top right)

### Step 2: Import Repository
1. **Find**: `meruvanithin27/SkillVouchAI-Hexart`
2. **Click**: "Import"
3. **Branch**: `main` (default)

### Step 3: Configure Project Settings
```
Project Name: skillvouch-ai-frontend
Framework Preset: Vite
Root Directory: Frontend
```

### Step 4: Add Environment Variable (CRITICAL!)
1. **Scroll down** to "Environment Variables" section
2. **Click**: "Add New"
3. **Fill exactly**:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://skillvouchai-hexart.onrender.com/api`
   - **Environments**: ✅ Production ✅ Preview ✅ Development
4. **Click**: "Save"

**⚠️ IMPORTANT**: 
- Name must be EXACTLY `NEXT_PUBLIC_API_URL`
- Value must include `/api` at the end
- Case-sensitive!

### Step 5: Build Settings (should auto-detect)
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 6: Deploy
1. **Review settings**
2. **Click**: "Deploy"
3. **Wait 2-3 minutes** for build and deployment

## 🧪 After Deployment

### Test Your Application
1. **Visit**: Your Vercel URL (e.g., `https://skillvouch-ai-frontend.vercel.app`)
2. **Test Signup**:
   - Click "Sign Up"
   - Fill: Name, Email, Password
   - Should work without "string pattern" errors
3. **Test Login**:
   - Use created credentials
   - Should redirect to dashboard

### Verify Backend Connection
Open browser console (F12) and check:
- No CORS errors
- API calls succeed (Network tab)
- No "string pattern" validation errors

## 🔧 Configuration Files Explained

### Frontend/vite.config.ts
```typescript
proxy: {
  '/api': {
    target: env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  }
}
```
- Uses environment variable for backend URL
- Falls back to localhost for development

### Frontend/src/services/apiService.ts
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```
- Frontend uses environment variable to call backend
- Production: Uses your Render backend
- Development: Uses localhost backend

### Frontend/vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```
- Tells Vercel how to build your React app
- Ensures proper Vite configuration

## 🌐 Final URLs

**Backend (Render)**: `https://skillvouchai-hexart.onrender.com`
**Frontend (Vercel)**: `https://your-app-name.vercel.app`

**API Endpoints**:
- Signup: `https://skillvouchai-hexart.onrender.com/api/auth/signup`
- Login: `https://skillvouchai-hexart.onrender.com/api/auth/login`
- Health: `https://skillvouchai-hexart.onrender.com/api`

## 🔧 Troubleshooting

### "Network Error" or CORS Issues
- Backend might still be starting (wait 2-3 minutes)
- Check NEXT_PUBLIC_API_URL is correct
- Verify backend is accessible: `curl https://skillvouchai-hexart.onrender.com/api`

### "String pattern" Error
- This should be completely fixed now
- JavaScript validation replaced HTML patterns
- If still occurs, check browser console for specific errors

### Build Fails
- Check Frontend/package.json has correct scripts
- Verify all dependencies are installed
- Check Vercel build logs for specific errors

### Environment Variable Not Working
- Ensure variable starts with `NEXT_PUBLIC_`
- Check it's set for all environments
- Redeploy after changing variables

## 🎉 Success Indicators

✅ Frontend loads without errors
✅ Signup form works without validation errors  
✅ Login redirects to dashboard
✅ API calls show 200 status in browser Network tab
✅ No "string pattern" errors in console
✅ Backend receives requests (check Render logs)

## 🔄 Auto-Deployment

Both platforms are configured for auto-deploy:
- **Render**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

Future GitHub changes will automatically deploy to both platforms!

**Your full-stack application is ready for production! 🚀**
