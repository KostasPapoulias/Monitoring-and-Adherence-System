# ⚡ Quick Start: Local Development

## Prerequisites
- Node.js 18+
- Docker Desktop (for easy setup)
- OR PostgreSQL 15 installed locally

---

## Option 1: Docker Compose (Recommended - 3 commands)

```bash
# 1. Navigate to project root
cd Monitoring-and-Adherence-System-main

# 2. Start all services (database, backend, frontend)
cd integration
docker-compose -f docker-compose.local.yml up -d

# 3. Done! Open browser
# Frontend: http://localhost:4200
# Backend: http://localhost:8080
```

View the database visually:
```bash
cd ../backend
npm run db:studio
```

Stop everything:
```bash
cd ../integration
docker-compose -f docker-compose.local.yml down
```

---

## Option 2: Without Docker (Manual)

### Terminal 1: Database

```bash
# Create local Postgres database
createdb ami_dev -U postgres

# Or use Docker just for database:
docker run --name ami-postgres -e POSTGRES_DB=ami_dev -p 5432:5432 -d postgres:15
```

### Terminal 2: Backend

```bash
cd backend

npm install
npm run db:push    # Setup database schema

npm run dev        # Start backend on port 8081
```

### Terminal 3: Frontend

```bash
cd frontend

npm install
npm start          # Opens browser on localhost:4200
```

---

## What Just Happened?

✓ **Frontend** (Angular on port 4200) - web UI
✓ **Backend** (Express + TypeScript on port 8080) - API server  
✓ **Database** (Postgres on port 5432) - stores all data

They're connected! Try:
1. Open http://localhost:4200
2. Check the console network tab to see `/api/` calls
3. All requests go to the backend

---

## Make Changes & See Live Updates

```bash
# Frontend changes auto-reload
# Edit: frontend/src/app/**/*.ts
# Changes appear instantly in browser

# Backend changes auto-restart
# Edit: backend/src/**/*.ts
# Changes appear instantly (nodemon watches)

# Database schema changes
# Edit: backend/prisma/schema.prisma
# Then: npm run db:migrate (creates migration)
```

---

## Next: Deploy to Railway + Netlify

See `DEPLOYMENT_GUIDE.md` for the full guide on deploying to production.

Quick summary:
1. Push to GitHub
2. Connect Railway to backend
3. Connect Netlify to frontend
4. Everything auto-deploys! 🚀

---

## Common Issues

**Backend can't connect to database?**
```bash
# Check if Postgres is running
docker ps | grep postgres

# Or if using local Postgres:
psql -U postgres -d ami_dev -c "SELECT 1"
```

**Port already in use?**
```bash
# Kill process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or macOS/Linux
lsof -i :8080
kill -9 <PID>
```

**Node modules broken?**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

Good luck! 🎉
