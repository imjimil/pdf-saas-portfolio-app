# Render Backend Deployment Guide

Deploy the Mypdftools backend to [Render](https://render.com) instead of Railway.

## Prerequisites

- Render account (free tier works)
- MongoDB Atlas connection string (you already have this in `atlas-credentials.env`)
- Frontend hosted on Vercel (or another static host)

## Step 1: Push your code to GitHub

Render deploys from a Git repository. Make sure your project is on GitHub.

## Step 2: Create a Web Service on Render

### Option A: Use the Blueprint (recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo: `pdf-saas-portfolio-app`
4. Render reads `render.yaml` at the repo root and creates the backend service
5. When prompted, fill in the secret environment variables (see Step 3)

### Option B: Manual setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `mypdftools-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for always-on)

## Step 3: Environment Variables

In Render → your service → **Environment**, add:

### Required

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/mypdftools?retryWrites=true&w=majority
JWT_SECRET=<random-64-char-hex-string>
SESSION_SECRET=<random-64-char-hex-string>
FRONTEND_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

Use your Atlas URI from `atlas-credentials.env`. Add `/mypdftools` before the `?` if it is missing.

Generate secrets locally:

```bash
openssl rand -hex 32
```

### Google OAuth (optional)

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/api/auth/google/callback
```

### OCR (optional)

```env
OCR_SPACE_API_KEY=your-ocr-space-api-key
```

Render sets `PORT` automatically — do not override it.

## Step 4: MongoDB Atlas Network Access

In MongoDB Atlas → **Network Access**, allow Render to connect:

- Add IP: `0.0.0.0/0` (allows all IPs — fine for free tier; tighten later if needed)

## Step 5: Get your Render URL

After deploy, Render gives you a URL like:

```
https://mypdftools-backend.onrender.com
```

Test the health check:

```
https://mypdftools-backend.onrender.com/api/health
```

Expected response: `{"status":"ok","message":"Mypdftools API is running"}`

## Step 6: Update the frontend (Vercel)

In Vercel → Project → **Settings** → **Environment Variables**:

```env
VITE_API_URL=https://mypdftools-backend.onrender.com/api
```

Redeploy the frontend after saving.

## Step 7: Google OAuth callback (if using Google login)

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URI**:
   ```
   https://mypdftools-backend.onrender.com/api/auth/google/callback
   ```
4. Update `GOOGLE_CALLBACK_URL` on Render to match

## Free tier notes

- Render free web services **spin down after ~15 minutes** of inactivity; the first request after idle can take 30–60 seconds (cold start).
- For production traffic, consider the Starter plan for always-on uptime.

## Troubleshooting

### Build fails

- Check **Logs** in the Render dashboard
- Run locally: `cd backend && npm install && npm run build`

### MongoDB connection errors

- Verify `MONGODB_URI` and URL-encode special characters in the password
- Confirm Atlas Network Access allows `0.0.0.0/0`

### CORS errors

- `FRONTEND_URL` must match your Vercel URL exactly (including `https://`, no trailing slash)

### 503 on first request (free tier)

- Normal cold start — wait and retry

## Local development

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
