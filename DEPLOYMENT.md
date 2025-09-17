# 🚀 ItemFinder Deployment Guide

## Fastest Deployment Options

### Option 1: Railway (5 minutes) ⚡ RECOMMENDED

**Step 1: Prepare your code**
```bash
git add .
git commit -m "ItemFinder ready for deployment"
git push origin main
```

**Step 2: Deploy**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your ItemFinder repository
5. Railway will auto-detect your Node.js app

**Step 3: Configure Environment**
1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add: `GEMINI_API_KEY` = `your_actual_api_key`
4. Add: `PORT` = `5000`

**Step 4: Access your live game!**
- Railway gives you a URL like `https://itemfinder-production.railway.app`
- Share this URL with friends to play together!

---

### Option 2: Vercel + Railway Split (10 minutes) 🔥

**Frontend (Vercel):**
```bash
cd client
npm run build
# Upload dist/ folder to vercel.com
```

**Backend (Railway):**
- Deploy server/ folder to Railway
- Add GEMINI_API_KEY environment variable
- Get Railway backend URL

**Connect them:**
- Update client's API calls to point to Railway backend URL

---

### Option 3: Render (15 minutes) 🌐

1. Go to [render.com](https://render.com)
2. "New Web Service"
3. Connect GitHub repo
4. Build command: `cd server && npm install`
5. Start command: `cd server && npm start`
6. Add environment variable: `GEMINI_API_KEY`

---

## Important Notes 📝

### Environment Variables Needed:
```
GEMINI_API_KEY=your_google_ai_studio_api_key
CORS_ORIGIN=https://your-frontend-domain.com
PORT=5000
```

### Camera Requirements:
- **HTTPS is required** for camera access on mobile
- All deployment platforms provide HTTPS automatically
- Works on localhost for development

### Mobile Optimization:
- Game is designed mobile-first
- Camera works on iOS Safari, Android Chrome
- PWA-ready (can be "installed" to home screen)

### Testing Your Deployment:
1. Open the deployed URL on your phone
2. Create a room with difficulty setting
3. Start game and test camera capture
4. Verify AI image validation works
5. Complete a full game to test results page

## Troubleshooting 🔧

**Camera not working?**
- Ensure HTTPS is enabled (automatic on deployment platforms)
- Grant camera permissions when prompted
- Try different browsers if issues persist

**AI not working?**
- Check GEMINI_API_KEY is set correctly
- Verify API key has proper permissions
- Game falls back to random validation if AI fails

**Connection issues?**
- Check CORS_ORIGIN matches your frontend domain
- Ensure Socket.IO can connect (check browser console)

## Share Your Game! 🎮

Once deployed, share your URL:
- `https://your-app-name.railway.app` (Railway)
- `https://your-app-name.vercel.app` (Vercel)
- `https://your-app-name.onrender.com` (Render)

Players can bookmark it, add to home screen, and play together from anywhere!