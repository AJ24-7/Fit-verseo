# 🚀 Deployment Guide - Vercel (Frontend) + Render (Backend)

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [x] GitHub account (to push code)
- [x] Render account (https://render.com - for backend)
- [x] Vercel account (https://vercel.com - for frontend)
- [x] MongoDB Atlas account (https://mongodb.com/atlas - for database)

### Code Preparation
✅ All frontend files now use centralized `config.js`
✅ CORS configuration ready for production
✅ Environment variables documented

---

## Backend Deployment (Render)

### Step 1: Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Web Service

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect GitHub Repository**
4. **Configure Service**:
   - **Name**: `fitverse-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `.` (leave empty or use root)
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free` (or paid for better performance)

### Step 3: Set Environment Variables in Render

Go to **Environment** tab and add these variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Sets Node environment |
| `PORT` | `5000` | Port (Render auto-assigns, but good to set) |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-super-secret-key-min-32-chars` | JWT signing key (generate secure one) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (add after frontend deploy) |
| `ADMIN_EMAIL` | `admin@fitverse.com` | Admin email for notifications |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | Razorpay Key (if using) |
| `RAZORPAY_KEY_SECRET` | `your_secret` | Razorpay Secret (if using) |
| `EMAIL_USER` | `your-email@gmail.com` | Email for sending notifications |
| `EMAIL_PASS` | `your-app-password` | Email app password |

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (~5-10 minutes)
3. Note your backend URL: `https://fitverse-backend.onrender.com`

### Step 5: Update server.js CORS (IMPORTANT!)

The `server.js` already has CORS configured, but verify it includes:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    process.env.FRONTEND_URL, // Vercel URL
    /\.vercel\.app$/ // Allow all Vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Configure Frontend

1. **Update `frontend/config.js`**:
   - Find line with `API_URL: import.meta?.env?.VITE_API_URL || 'https://your-backend.onrender.com'`
   - Replace `'https://your-backend.onrender.com'` with your **actual Render backend URL**

Example:
```javascript
PRODUCTION: {
    API_URL: import.meta?.env?.VITE_API_URL || 'https://fitverse-backend.onrender.com',
    ENV_NAME: 'production'
}
```

2. **Create `vercel.json` in project root**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "rewrites": [
    {
      "source": "/",
      "destination": "/frontend/index.html"
    }
  ]
}
```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/new
2. **Import Git Repository**: Connect your GitHub repo
3. **Configure Project**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `frontend` (or leave as `.` and use vercel.json)
   - **Build Command**: (leave empty for static site)
   - **Output Directory**: `frontend` (or `.`)

4. **Environment Variables** (Optional):
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://fitverse-backend.onrender.com` |

5. **Click "Deploy"**

6. **Note your frontend URL**: `https://your-app.vercel.app`

#### Option B: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? fitverse
# - Directory? ./ (current directory)
# - Override settings? N

# Production deployment
vercel --prod
```

### Step 4: Update Backend FRONTEND_URL

1. Go back to **Render Dashboard**
2. Navigate to your backend service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` with your Vercel URL: `https://your-app.vercel.app`
5. Save and wait for auto-redeploy

---

## Environment Variables

### Backend Environment Variables (Render)

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitverse?retryWrites=true&w=majority

# JWT Secret (MUST be at least 32 characters)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-random-string

# Frontend URL (your Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app

# Admin Configuration
ADMIN_EMAIL=admin@fitverse.com

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Optional: Session Secret
SESSION_SECRET=another-random-secret-for-sessions
```

### Frontend Environment Variables (Vercel) - Optional

```env
# API URL (if using environment variable approach)
VITE_API_URL=https://fitverse-backend.onrender.com
```

---

## Post-Deployment Checklist

### ✅ Backend Health Check
- [ ] Visit `https://your-backend.onrender.com/api/health` (should return OK)
- [ ] Check Render logs for errors
- [ ] Test MongoDB connection (check logs)
- [ ] Verify CORS headers (use browser DevTools Network tab)

### ✅ Frontend Health Check
- [ ] Visit `https://your-app.vercel.app`
- [ ] Open browser DevTools → Console (check for errors)
- [ ] Check Network tab for API calls
- [ ] Verify API calls go to Render backend (not localhost)
- [ ] Test login/register functionality
- [ ] Test gym search and details
- [ ] Test grievance submission

### ✅ End-to-End Testing
- [ ] User Registration & Login
- [ ] Gym Admin Login
- [ ] Main Admin Login
- [ ] Gym Search & Filtering
- [ ] Booking Trial Classes
- [ ] Submitting Grievances
- [ ] Payment Flow (if using Razorpay)
- [ ] Image Uploads
- [ ] Notifications

### ✅ Database Setup
- [ ] MongoDB Atlas cluster is running
- [ ] Network access allows Render IPs (0.0.0.0/0 or specific)
- [ ] Database user has read/write permissions
- [ ] Collections are created properly

---

## Troubleshooting

### Problem: "Failed to fetch" errors in frontend

**Solution:**
1. Check browser console for exact error
2. Verify `frontend/config.js` has correct Render URL
3. Check CORS configuration in `server.js`
4. Ensure `FRONTEND_URL` env var is set in Render
5. Check Network tab → Headers → Response Headers for CORS headers

### Problem: Backend shows "Cannot connect to MongoDB"

**Solution:**
1. Verify `MONGODB_URI` in Render environment variables
2. Check MongoDB Atlas → Network Access → Allow Render IPs (0.0.0.0/0)
3. Test connection string locally first
4. Check Render logs for specific error

### Problem: Images not loading

**Solution:**
1. Check if image URLs use `window.API_CONFIG.assetUrl()` helper
2. Verify uploads directory exists on Render
3. Consider using cloud storage (AWS S3, Cloudinary) for production
4. Check Render logs for file upload errors

### Problem: Authentication not working

**Solution:**
1. Verify `JWT_SECRET` is set in Render (min 32 chars)
2. Check if token is being sent in Authorization header
3. Test login endpoint directly: `POST https://your-backend.onrender.com/api/users/login`
4. Check browser localStorage for token

### Problem: Render app goes to sleep (Free tier)

**Solution:**
1. Free tier sleeps after 15 mins of inactivity
2. First request takes ~30-60 seconds to wake up
3. Upgrade to paid tier for 24/7 uptime
4. Or use external monitoring service to ping every 10 mins

### Problem: Vercel deployment shows 404

**Solution:**
1. Check `vercel.json` configuration
2. Verify root directory is set correctly
3. Ensure `index.html` exists in correct location
4. Check Vercel deployment logs

---

## Additional Resources

### MongoDB Atlas Setup
1. Create cluster at https://cloud.mongodb.com
2. Create database user (Database Access)
3. Whitelist all IPs: Network Access → Add IP → 0.0.0.0/0
4. Get connection string: Cluster → Connect → Connect your application

### Generate Secure JWT Secret
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

### Testing API Locally Before Deploy
```bash
# Start backend
cd backend
npm install
node server.js

# Test endpoints
curl http://localhost:5000/api/health
```

---

## Quick Reference

### Important Files Modified for Deployment
- ✅ `frontend/config.js` - Centralized API configuration
- ✅ `server.js` - CORS configuration for production
- ⚠️ `vercel.json` - Vercel deployment config (CREATE THIS)
- ⚠️ Update all frontend files to use `window.API_CONFIG` (IN PROGRESS)

### Key URLs (Replace with yours)
- **Backend**: https://fitverse-backend.onrender.com
- **Frontend**: https://your-app.vercel.app
- **MongoDB**: mongodb+srv://cluster.mongodb.net/fitverse

---

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → Click deployment
3. Check browser console for frontend errors
4. Test API endpoints using Postman/Thunder Client

---

**Last Updated**: [Current Date]
**Deployment Status**: Ready for production deployment

