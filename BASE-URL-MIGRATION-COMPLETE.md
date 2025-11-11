# ✅ BASE URL Migration Complete

## Summary
All frontend JavaScript files have been updated to use the centralized `window.API_CONFIG.BASE_URL` instead of hardcoded `http://localhost:5000` URLs.

## Files Updated

### HTML Files (Added `<script src="config.js"></script>`)
1. ✅ `frontend/index.html`
2. ✅ `frontend/gymdetails.html`
3. ✅ `frontend/dietplans.html`
4. ✅ `frontend/membership-plans.html`
5. ✅ `frontend/personaltraining.html`
6. ✅ `frontend/contact.html`

### JavaScript Files (Replaced hardcoded URLs)
1. ✅ `frontend/script.js` - Main homepage logic
2. ✅ `frontend/gymdetails.js` - Gym details page (all localhost references replaced)
3. ✅ `frontend/gymdetails-offers.js` - Already using window.API_CONFIG.BASE_URL
4. ✅ `frontend/personaltraining.js` - Profile fetch URLs
5. ✅ `frontend/contact.js` - All API calls (profile, quick messages, contact submission)
6. ✅ `frontend/coupon-integration.js` - Coupon validation
7. ✅ `frontend/user-coupons-manager.js` - User profile and coupons fetch
8. ✅ `frontend/gymadmin/modules/support-reviews.js` - Gym admin panel
9. ✅ `frontend/gymadmin/modules/grievance-handler.js` - Grievance system

### Backend Files
1. ✅ `server.js` - Enhanced CORS configuration for Vercel + Render

## Configuration Files
1. ✅ `frontend/config.js` - Centralized API configuration (auto-detects environment)
2. ✅ `vercel.json` - Vercel deployment configuration
3. ✅ `DEPLOYMENT-GUIDE.md` - Comprehensive deployment instructions
4. ✅ `PRE-DEPLOYMENT-CHECKLIST.md` - Step-by-step checklist
5. ✅ `DEPLOYMENT-STATUS.md` - Progress tracking

## Changes Made

### Pattern Replaced
```javascript
// OLD (hardcoded)
const BASE_URL = 'http://localhost:5000';
fetch('http://localhost:5000/api/users/profile');

// NEW (centralized config)
const BASE_URL = window.API_CONFIG.BASE_URL;
fetch(`${BASE_URL}/api/users/profile`);
```

### HTML Script Loading Order
```html
<!-- IMPORTANT: Load config.js FIRST -->
<script src="config.js"></script>
<script defer src="your-script.js"></script>
```

## Environment Detection

The `config.js` automatically detects:
- **Development:** `localhost` or `127.0.0.1` → Uses `http://localhost:5000`
- **Production:** Any other domain → Uses configured production URL

## Next Steps

### 1. Local Testing
```bash
# Start backend
cd backend
node server.js

# Serve frontend (new terminal)
cd frontend
python -m http.server 8000
# OR
npx serve .

# Test at: http://localhost:8000
```

### 2. Update Production URL
Edit `frontend/config.js` line 22:
```javascript
PRODUCTION: {
    API_URL: import.meta?.env?.VITE_API_URL || 'https://YOUR-RENDER-BACKEND-URL.onrender.com',
    ENV_NAME: 'production'
}
```

### 3. Deploy

#### Backend (Render)
1. Push to GitHub
2. Create Web Service on Render
3. Set environment variables (see DEPLOYMENT-GUIDE.md)
4. Note your backend URL

#### Frontend (Vercel)
1. Update config.js with Render backend URL
2. Push changes to GitHub
3. Import repo to Vercel
4. Deploy

### 4. Final Configuration
Go to Render → Environment Variables:
```
FRONTEND_URL = https://your-app.vercel.app
```

## Verification

### Check Config Loaded
Open browser console on any page:
```javascript
window.API_CONFIG
// Should show:
// {
//   BASE_URL: "http://localhost:5000" (dev) or production URL
//   ENVIRONMENT: "development" or "production"
//   IS_PRODUCTION: false or true
//   ...
// }
```

### Check API Calls
1. Open DevTools → Network tab
2. Perform any action (search gyms, login, etc.)
3. Verify API calls go to correct BASE_URL

## Files That Already Use Correct Pattern
- `frontend/membership-plans.js` - Already uses `window.API_CONFIG.BASE_URL`
- `frontend/api-config.js` - Has environment detection (legacy, but config.js is better)

## Notes
- All image URLs now use `${BASE_URL}` for profile pics, gym logos, etc.
- CORS is configured to allow both development and production origins
- Config is loaded globally via `window.API_CONFIG` object

## Testing Checklist
- [x] Config loads on all pages
- [x] BASE_URL correctly set in dev environment
- [ ] Test all pages locally (index, gymdetails, contact, dietplans, etc.)
- [ ] Test login/register flow
- [ ] Test gym search
- [ ] Test grievance submission
- [ ] Deploy to production
- [ ] Test production environment

---

**Last Updated:** November 11, 2025
**Status:** ✅ Ready for local testing and production deployment
