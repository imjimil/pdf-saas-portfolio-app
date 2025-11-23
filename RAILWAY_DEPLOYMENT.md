# Railway Backend Deployment Guide

This guide will help you deploy the Mypdftools backend to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- MongoDB Atlas connection string (already set up)
- Vercel frontend URL (already deployed)

## Step 1: Create a New Railway Project

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (recommended) or **"Empty Project"**

### Option A: Deploy from GitHub (Recommended)

1. Connect your GitHub account if not already connected
2. Select your repository: `pdf-saas-portfolio-app`
3. Railway will detect the backend folder automatically
4. Click **"Deploy"**

### Option B: Deploy from Local Directory

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize Railway in the backend directory:
   ```bash
   cd backend
   railway init
   ```

4. Deploy:
   ```bash
   railway up
   ```

## Step 2: Configure Environment Variables

In your Railway project dashboard, go to **Variables** tab and add the following:

### Required Variables

```env
# MongoDB Connection (you already have this)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mypdftools?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars

# Frontend URL (your Vercel URL)
FRONTEND_URL=https://your-app-name.vercel.app

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-here
```

### Optional Variables (for Google OAuth)

```env
# Google OAuth (if you want Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-railway-app.railway.app/api/auth/google/callback
```

### Optional Variables (for OCR)

```env
# OCR.space API Key (for PDF OCR functionality)
OCR_SPACE_API_KEY=your-ocr-space-api-key
```

## Step 3: Set Root Directory (if deploying from GitHub)

If you deployed from GitHub and Railway didn't detect the backend folder:

1. Go to your service settings
2. Under **"Source"**, set **Root Directory** to: `backend`
3. Railway will redeploy automatically

## Step 4: Configure Build Settings

Railway should automatically detect:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

If not, manually set:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## Step 5: Get Your Railway URL

1. After deployment, Railway will provide a URL like: `https://your-app-name.up.railway.app`
2. Copy this URL - you'll need it for:
   - `GOOGLE_CALLBACK_URL` (if using Google OAuth)
   - Frontend API configuration

## Step 6: Update Frontend API URL

Update your Vercel frontend environment variable:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update or add:
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```
3. Redeploy your frontend

## Step 7: Update Google OAuth Callback URL (if using Google OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://your-railway-app.railway.app/api/auth/google/callback
   ```
5. Save

## Step 8: Verify Deployment

1. Check Railway logs to ensure the server started successfully
2. Test the health endpoint:
   ```
   https://your-railway-app.railway.app/api/health
   ```
   Should return: `{"status":"ok","message":"Mypdftools API is running"}`

3. Test from your frontend - try logging in or using a tool

## Troubleshooting

### Build Fails

- Check Railway logs for errors
- Ensure `package.json` has correct build script: `"build": "tsc"`
- Verify TypeScript compiles locally: `cd backend && npm run build`

### Server Won't Start

- Check logs for MongoDB connection errors
- Verify `MONGODB_URI` is correct and URL-encoded
- Ensure MongoDB Atlas allows connections from Railway's IP (use `0.0.0.0/0` for all IPs)

### CORS Errors

- Verify `FRONTEND_URL` matches your Vercel URL exactly (including `https://`)
- Check that CORS is configured in `server.ts`

### 500 Errors

- Check Railway logs for detailed error messages
- Verify all required environment variables are set
- Check MongoDB connection is working

### Port Issues

- Railway automatically sets `PORT` environment variable
- Your server should use `process.env.PORT` (which it does)

## Railway CLI Commands (Optional)

If you installed Railway CLI:

```bash
# View logs
railway logs

# Open project in browser
railway open

# View environment variables
railway variables

# Set environment variable
railway variables set KEY=value

# Deploy
railway up
```

## Next Steps

1. ✅ Backend deployed to Railway
2. ✅ Frontend deployed to Vercel
3. ✅ MongoDB connected
4. ✅ Environment variables configured
5. 🎉 Your app should be live!

## Support

If you encounter issues:
1. Check Railway logs: Dashboard → Your Service → Logs
2. Check MongoDB Atlas connection
3. Verify all environment variables are set correctly
4. Test API endpoints directly using curl or Postman

