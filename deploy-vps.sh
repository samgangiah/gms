#!/bin/bash
set -e

# Deployment script for Gilnokie GMS on VPS
# This script deploys using Supabase CLI (same as local dev)

echo "🚀 Gilnokie VPS Deployment Script"
echo "=================================="
echo ""

# Check if running on VPS
if [ ! -d "~/vps/projects" ]; then
    PROJECT_DIR="$HOME/vps/projects/gms"
else
    PROJECT_DIR="$(pwd)"
fi

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Step 1: Install Supabase CLI if not installed
echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
    echo "✅ Supabase CLI installed"
else
    echo "✅ Supabase CLI already installed ($(supabase --version))"
fi
echo ""

# Step 2: Start Supabase
echo "Step 2: Starting Supabase services..."
cd "$PROJECT_DIR/supabase"
supabase start
echo ""

# Step 3: Get Supabase credentials
echo "Step 3: Supabase credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
supabase status | grep -E "(API URL|Database URL|anon key|service_role key)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Copy these values to your .env file!"
echo ""

# Step 4: Check if .env exists
cd "$PROJECT_DIR"
if [ ! -f ".env" ]; then
    echo "Step 4: Creating .env from template..."
    cp .env.production.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add:"
    echo "   - Strong POSTGRES_PASSWORD"
    echo "   - Supabase credentials from above"
    echo ""
    echo "Then run this script again to continue deployment."
    exit 0
else
    echo "Step 4: .env file exists ✅"
fi
echo ""

# Step 5: Build and start Docker containers
echo "Step 5: Building Docker containers..."
docker compose build
echo "✅ Build complete"
echo ""

echo "Step 6: Starting application..."
docker compose up -d
echo "✅ Application started"
echo ""

# Step 7: Run database migrations
echo "Step 7: Running database migrations..."
sleep 5  # Wait for containers to be ready
docker compose exec -T app npx prisma migrate deploy
echo "✅ Migrations complete"
echo ""

# Step 8: Show status
echo "Step 8: Deployment status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Supabase services:"
cd "$PROJECT_DIR/supabase"
supabase status
echo ""
cd "$PROJECT_DIR"
echo "Docker containers:"
docker compose ps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://gms.digitalrain.cloud"
echo ""
echo "🔧 Supabase Studio (admin UI):"
echo "   http://$(hostname -I | awk '{print $1}'):54323"
echo ""
echo "📊 View logs:"
echo "   docker compose logs -f app"
echo ""
