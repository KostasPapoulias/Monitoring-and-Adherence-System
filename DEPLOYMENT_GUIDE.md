# 🚀 Deployment Guide: Railway + Netlify

## Overview

Your AMI (Adherence Monitoring and Interaction) app now supports deployment on:
- **Backend**: Railway (with Postgres database)
- **Frontend**: Netlify (with automatic Angular builds)

### Architecture

```
┌─────────────────────────────────────────┐
│  Netlify (Frontend)                     │
│  - Angular app (built from src/)        │
│  - Static hosting                       │
│  - API rewrites to Railway backend      │
└─────────────┬───────────────────────────┘
              │ /api requests
              ↓
┌─────────────────────────────────────────┐
│  Railway (Backend)                      │
│  - Express API (TypeScript)             │
│  - Socket.IO server                     │
│  - Prisma ORM                           │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│  Railway (Postgres Database)            │
│  - Managed by Railway                   │
│  - Auto-backups included                │
└─────────────────────────────────────────┘
```

---

## Part 1: Backend Setup on Railway

### Step 1a: Create Railway Account & Project

1. Go to [railway.app](https://railway.app)
2. Sign up / Log in with GitHub
3. Create a new project (click "+ New Project")

### Step 1b: Add Postgres Database to Railway

4. In your Railway project, click "Add Service"
5. Select "Database" → "Postgres"
6. Railway will create a Postgres database automatically
7. Click on the Postgres service to see connection details
8. **Copy the DATABASE_URL** (it looks like: `postgresql://user:password@host:port/db`)

### Step 1c: Deploy Backend from GitHub

9. Go to your Railway project → "Add Service" → "GitHub Repo"
10. Connect your GitHub and select this repo
11. It will detect the backend (`backend/Dockerfile.railway`)
12. Wait a minute, Railway will auto-detect and build
13. Go to the backend service settings
14. Add environment variables:
    - `DATABASE_URL`: Paste from Step 1b
    - `NODE_ENV`: `production`

### Step 1d: Run Prisma Migrations

15. Click on the Railway backend service
16. Click "Terminal" (or use Railway CLI: `railway shell`)
17. Run: `npm run db:push` (to push schema to Postgres)
18. Or wait for first deployment - it runs migrations automatically

### Result
Your backend is now live at a Railway URL like: `https://your-app-backend-xxxx.up.railway.app`

---

## Part 2: Frontend Setup on Netlify

### Step 2a: Create Netlify Account

1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign up / Log in with GitHub

### Step 2b: Deploy Frontend from GitHub

3. Click "Import an existing project"
4. Connect your GitHub and select this repo
5. Configure build settings:
   - **Build command**: `npm run build -- --configuration production`
   - **Publish directory**: `dist/frontend`
   - **Base directory**: `frontend`
6. Click "Deploy site"
7. Netlify will build and deploy automatically

### Step 2c: Update API URL

8. After first deploy, get your backend Railway URL from Step 1d
9. Go to Netlify site settings → "Build & deploy" → "Environment"
10. In your `frontend/netlify.toml`, update this line:
    ```toml
    to = "https://YOUR_RAILWAY_BACKEND_URL.up.railway.app/api/:splat"
    ```
11. Redeploy (git push or click "Redeploy site")

### Result
Your frontend is live at: `https://your-site-name.netlify.app`

---

## Part 3: Local Development (with Docker & Postgres)

### Prerequisites
- Docker Desktop installed
- PostgreSQL 15 (if running without Docker)

### Option A: With Docker Compose (Easiest)

```bash
cd integration
docker-compose -f docker-compose.local.yml up -d
```

This starts:
- ✓ Postgres database on localhost:5432
- ✓ Backend on localhost:8080
- ✓ Frontend on localhost:4200

### Option B: Without Docker (Manual Setup)

1. **Install Postgres locally**:
   ```bash
   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Windows (using installer)
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database**:
   ```bash
   createdb ami_dev -U postgres
   ```

3. **Backend setup**:
   ```bash
   cd backend
   npm install
   
   # Create .env with:
   # DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ami_dev
   # NODE_ENV=development
   
   npm run db:push  # Push Prisma schema to database
   npm run dev      # Start backend
   ```

4. **Frontend setup** (new terminal):
   ```bash
   cd frontend
   npm install
   npm start        # Starts on localhost:4200
   ```

---

## Database Management

### View Database in Prisma Studio (Recommended)

Locally:
```bash
cd backend
npm run db:studio
```

On Railway (via CLI):
```bash
railway shell
npm run db:studio
```

### Run Migrations

After modifying `prisma/schema.prisma`:

```bash
cd backend

# After changing schema locally:
npm run db:migrate

# On Railway (via CLI):
railway shell
npm run db:migrate
```

### Seed Initial Data

```bash
cd backend
npm run seed:personas
```

---

## Environment Variables Explained

### Local Development (`.env` in backend/)
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ami_dev
PORT=8081
HOST=localhost
PROTOCOL=http
```

### Railway (Auto-provided)
```env
DATABASE_URL=postgresql://... (auto-set by Railway)
NODE_ENV=production
PORT=8080 (auto-assigned)
RAILWAY_SERVICE_DOMAIN=your-app.up.railway.app (auto-set)
```

---

## Common Tasks

### Browse Database
```bash
cd backend
npm run db:studio
# Opens http://localhost:5555 in browser
```

### Check Backend Logs
Railway Dashboard → Backend Service → "Logs" tab

### Check Netlify Build Log
Netlify Dashboard → Deploys → Select build → "Logs" tab

### Redeploy Frontend
```bash
git push origin main  # Netlify auto-deploys
# Or manually redeploy in Netlify dashboard
```

### Redeploy Backend
```bash
git push origin main  # Railway auto-deploys
# Or manually trigger in Railway dashboard
```

### Connect to Railway Postgres from CLI
```bash
# Using Railway CLI
railway shell          # SSH into backend
psql $DATABASE_URL     # Connect to Postgres

# Using psql directly (need RailwayDB connection string)
psql postgresql://user:password@host:port/database
```

---

## Docker Explanation for Learners

### What is Docker?

Docker is like a **container** - it packages your app, all its dependencies, and configuration into one portable unit. Think of it like a shipping container for software.

### Why Use Docker?

1. **Consistency**: App works the same on your laptop, on Railway, everywhere
2. **Reproducibility**: Other devs can run exact same environment
3. **Isolation**: Your app and database don't interfere with other things on the computer

### Our Docker Setup

**For Local Development** (`docker-compose.local.yml`):
- 3 services: Postgres, Backend, Frontend
- All connected on an internal network
- Easy to tear down: `docker-compose down`

**For Railway Deployment** (`Dockerfile.railway`):
- Multi-stage build (optimizes size)
- Runs only what's needed for production
- Auto-runs Prisma migrations on startup

### Key Files

- `backend/Dockerfile.railway` - Instructions for building the backend image
- `integration/docker-compose.local.yml` - How services connect locally
- `integration/init-db.sql` - Setup script for Postgres

---

## Prisma ORM Explanation

### Why Prisma instead of MongoDB?

1. **Type Safety**: Full TypeScript support with auto-generated types
2. **Better for Relational Data**: Your data has relationships (Medications → Personas, etc.)
3. **Easier Migrations**: Clear version history of schema changes
4. **Prisma Studio**: Visual database browser

### How Prisma Works

1. You write schema in `prisma/schema.prisma`
2. Run `npm run db:migrate` 
3. Prisma generates:
   - Database tables
   - TypeScript types
   - Query client with autocomplete
4. Use in code: `const personas = await prisma.persona.findMany()`

### Prisma File Structure
```
backend/
  prisma/
    schema.prisma    ← Your database definition
    migrations/      ← All past migration files (auto-created)
    seed.ts          ← (Optional) initial data
```

---

## Frontend + Mobile: Different Modalities

Your app supports different UIs based on device:

### Persona Preferences
```typescript
interface IDevicePrefs {
  primaryDevice: 'wall-display' | 'smartphone' | 'smart-speaker' | 'smartwatch'
  modalities: { audio: boolean, visual: boolean, haptic: boolean }
  ui: { textSize, contrast, cognitiveMode }
}
```

### Example Implementations

**Wall Display UI** (large, detailed):
- Bigger text and buttons
- Touchscreen optimized
- Full medication history visible

**Smartphone UI** (compact):
- List-based navigation
- Touch-friendly
- Audio/haptic feedback enabled

**Smart Speaker** (audio only):
- Voice responses to queries
- Audio feedback for actions
- No visual interface

### How to Implement

In `frontend/src/app/`, create device-specific components:
```
app/
  components/
    wall-display/   ← For wall monitor
    smartphone/     ← For phones
    smartwatch/     ← For watches
    smart-speaker/  ← For audio-only
```

Use Angular's device detection to load right component:
```typescript
// In a service
detectDevice(): 'wall-display' | 'smartphone' | 'smartwatch' | 'smart-speaker' {
  if (window.innerWidth > 800) return 'wall-display'
  if (navigator.userAgent.includes('Watch')) return 'smartwatch'
  // ... etc
}
```

---

## Troubleshooting

### Backend won't start: "DATABASE_URL not set"
- ✓ Check Railway Postgres service is created
- ✓ Copy DATABASE_URL to backend environment variables
- ✓ Restart backend service

### Migrations fail
```bash
# Reset database (WARNING: deletes all data!)
cd backend
npx prisma migrate reset --force
```

### Netlify build fails: "npm not found"
- ✓ Check Node version in `netlify.toml`
- ✓ Make sure `package.json` exists in root of build directory

### Socket.IO connection issues
- ✓ Check CORS settings in backend
- ✓ Frontend env must have correct backend URL
- ✓ Check that backend is accessible from frontend domain

### Frontend can't reach backend
- ✓ In Netlify dashboard, verify the rewrite rule in `netlify.toml`
- ✓ Check that Railway backend URL in netlify.toml is correct
- ✓ Test backend directly: curl `https://backend-url/api/health`

---

## Next Steps to Keep Learning

1. **Modify database schema**:
   - Edit `backend/prisma/schema.prisma`
   - Run `npm run db:migrate`

2. **Add new API endpoints**:
   - Create in `backend/src/api/v1/`
   - Use auto-generated Prisma types

3. **Create device-specific UIs**:
   - Add components to `frontend/src/app/`
   - Use persona preferences to show right UI

4. **Add tests**:
   - Backend: Jest tests
   - Frontend: Karma tests

5. **Monitor in production**:
   - Railway dashboard for logs
   - Netlify analytics for frontend performance

---

## Quick Reference: Common Commands

```bash
# Local development
cd backend && npm run dev      # Start backend
cd frontend && npm start       # Start frontend

# Database
npm run db:migrate             # Create new migration
npm run db:push                # Apply schema directly
npm run db:studio              # Open visual DB browser

# Building
npm run build                  # Build for production

# Deployment
git push origin main           # Auto-deploys to Railway & Netlify
```

---

## Getting Help

- Railway docs: https://docs.railway.app
- Netlify docs: https://docs.netlify.com
- Prisma docs: https://www.prisma.io/docs
- Angular docs: https://angular.io/docs
- Express.js docs: https://expressjs.com

---

## Understanding the Flow

### When user opens app on phone:

1. **Browser loads** `https://your-netlify-site.netlify.app`
2. **Netlify serves** the Angular app (HTML, JS, CSS)
3. **Angular app loads** and detects device type (smartphone)
4. **Loads smartphone UI** components
5. **Makes API request** to `/api/personas` 
6. **Netlify rewrites** `/api/personas` → Railway backend
7. **Railway backend** processes request, queries Postgres
8. **Returns JSON** response to frontend
9. **Angular renders** the data in smartphone UI

### When user opens on wall display:

1-7. Same as above but...
8. **Loads wall-display UI** (larger, more detailed)
9. **Shows full medication schedule** with history

---

Happy deploying! 🎉
