# Vercel Deployment Guide — Invisible Queue

Invisible Queue is configured for unified, full-stack deployment on [Vercel](https://vercel.com). Both the React Vite client and the Express API deploy together under a single domain with zero CORS issues.

---

## 🚀 Quick Deploy Instructions

### Step 1: Push latest changes to GitHub
Ensure your repository is up to date:
```bash
git push origin main
```

### Step 2: Import into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your GitHub repository: `sumitkumar202006/Invisible-Queue`.
4. In the **Configure Project** screen:
   - **Framework Preset:** Select **Other** (or Vite).
   - **Root Directory:** Leave as `./` (default).
   - **Build Command:** `npm run build` (detected automatically from `vercel.json`).
   - **Output Directory:** `client/dist` (detected automatically from `vercel.json`).
5. Click **"Deploy"**.

---

## ⚙️ Environment Variables (Optional)

Under Project Settings ➔ **Environment Variables** in Vercel:

| Variable | Description | Default if omitted |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase / Neon / Render) | Uses built-in in-memory store with demo seed data |
| `JWT_SECRET` | Secret key for auth token signing | Built-in default key |
| `NODE_ENV` | Environment identifier | `production` |

> **Note:** If you don't configure `DATABASE_URL`, Invisible Queue automatically initializes with the realistic demo seed dataset (3 hospitals in Chandigarh with complete hourly historical patterns and active crowd reports).

---

## 🔍 Verifying the Deployment

Once Vercel finishes deploying:
1. Visit your Vercel deployment URL (e.g. `https://invisible-queue.vercel.app`).
2. Test the health probe: `https://invisible-queue.vercel.app/health`.
3. Test the locations API: `https://invisible-queue.vercel.app/api/v1/locations`.
4. Sign in to the Hospital Dashboard with:
   - Email: `admin@chdhealth.gov.in`
   - Password: `admin123`
