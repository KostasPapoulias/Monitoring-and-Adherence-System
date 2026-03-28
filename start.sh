#!/bin/bash

# Railway deployment script for Monitoring-and-Adherence-System
# This script handles building and running the backend service

set -e

echo "🚀 Starting Railway deployment..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Run migrations on database
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || npx prisma db push

# Start the application
echo "✅ Starting backend server..."
npm start
