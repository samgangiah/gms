# Gilnokie Project Setup Guide

**Date:** 2025-11-11
**Project:** Gilnokie Textile Factory System Modernization
**Purpose:** Complete setup guide for directory structure, Supabase configuration, and backup strategy

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Supabase Database Location Configuration](#supabase-database-location-configuration)
3. [Initial Setup Steps](#initial-setup-steps)
4. [Backup Strategy](#backup-strategy)
5. [Development Workflow](#development-workflow)
6. [Disaster Recovery](#disaster-recovery)
7. [Docker Configuration](#docker-configuration)

---

## Directory Structure

### Overview

```mermaid
graph TD
    A[/Users/sam/Dev/Gilnokie/] --> B[Investigation/]
    A --> C[SourceDataFromWade/]
    A --> D[docs/]
    A --> E[supabase/]
    A --> F[gilnokie-app/]
    A --> G[scripts/]
    A --> H[data/]
    A --> I[y/]
    A --> J[y-ephemeral/]

    B --> B1[BUILD_PLAN.md]
    B --> B2[investigation.md]

    C --> C1[Gilnokie/ - VB6 app]
    C --> C2[temp/ - extracted files]

    D --> D1[research-technical-2025-11-11.md]
    D --> D2[PRD future]
    D --> D3[Architecture future]

    E --> E1[config.toml]
    E --> E2[migrations/]
    E --> E3[seed.sql]

    F --> F1[app/]
    F --> F2[components/]
    F --> F3[lib/]
    F --> F4[prisma/]
    F --> F5[Dockerfile]
    F --> F6[docker-compose.yml]

    G --> G1[backup-database.sh]
    G --> G2[manual-backup.sh]
    G --> G3[restore-database.sh]

    H --> H1[postgres/]
    H --> H2[backups/]
    H --> H3[migrations-archive/]

    H2 --> H2A[daily/]
    H2 --> H2B[weekly/]
    H2 --> H2C[manual/]

    style H fill:#ff9999
    style H1 fill:#ff9999
    style H2 fill:#99ff99
    style A fill:#e1f5ff
```

### Detailed Structure

```
/Users/sam/Dev/Gilnokie/                    # Root project folder
│
├── Investigation/                           # Research & Analysis (Git tracked)
│   ├── BUILD_PLAN.md                       # Technical plan with 26 questions
│   └── investigation.md                     # VB6 app reverse engineering
│
├── SourceDataFromWade/                      # Legacy System (Reference only)
│   ├── Gilnokie/                           # Original VB6 application
│   └── temp/                               # Decompiled files (599 files)
│
├── docs/                                    # Documentation (Git tracked)
│   ├── research-technical-2025-11-11.md    # Tech stack validation
│   ├── PROJECT_SETUP_GUIDE.md              # This file
│   ├── (future) _prd.md                    # Product Requirements
│   ├── (future) _architecture.md           # Architecture decisions
│   └── (future) _ux-design.md              # UX design specs
│
├── supabase/                               # Supabase Configuration (Git tracked)
│   ├── config.toml                         # Supabase settings
│   ├── .gitignore                          # Ignore temp files
│   ├── migrations/                         # SQL migrations (if not using Prisma)
│   └── seed.sql                            # Seed data for development
│
├── gilnokie-app/                           # Next.js Application (Git tracked)
│   ├── app/                                # Next.js App Router
│   │   ├── (auth)/                         # Auth routes (login, etc.)
│   │   ├── (dashboard)/                    # Protected dashboard routes
│   │   ├── api/                            # API Routes (REST endpoints)
│   │   ├── layout.tsx                      # Root layout
│   │   └── page.tsx                        # Home page
│   │
│   ├── components/                         # React Components
│   │   ├── ui/                             # shadcn/ui components
│   │   ├── forms/                          # Form components
│   │   ├── tables/                         # Table components
│   │   └── layout/                         # Layout components
│   │
│   ├── lib/                                # Utilities & Libraries
│   │   ├── prisma.ts                       # Prisma client
│   │   ├── supabase.ts                     # Supabase client
│   │   ├── middleware.ts                   # RLS middleware
│   │   └── utils.ts                        # Utility functions
│   │
│   ├── hooks/                              # React Hooks
│   │   ├── use-job-cards.ts                # TanStack Query hooks
│   │   ├── use-auth.ts                     # Auth hooks
│   │   └── use-offline.ts                  # PWA offline hooks
│   │
│   ├── store/                              # Zustand Stores
│   │   ├── ui-store.ts                     # UI state
│   │   └── form-draft-store.ts             # Form drafts
│   │
│   ├── types/                              # TypeScript Types
│   │   └── index.ts                        # Exported types
│   │
│   ├── prisma/                             # Prisma Configuration
│   │   ├── schema.prisma                   # Database schema
│   │   ├── migrations/                     # Migration history
│   │   └── seed.ts                         # Seed script
│   │
│   ├── public/                             # Static Assets
│   │   ├── manifest.json                   # PWA manifest
│   │   ├── icon-192.png                    # PWA icons
│   │   ├── icon-512.png
│   │   └── sw.js                           # Service worker (generated)
│   │
│   ├── Dockerfile                          # Docker build config
│   ├── docker-compose.yml                  # Docker orchestration
│   ├── next.config.js                      # Next.js config
│   ├── tailwind.config.ts                  # Tailwind config
│   ├── tsconfig.json                       # TypeScript config
│   ├── package.json                        # Dependencies
│   ├── .env.local                          # Local environment (not in Git)
│   ├── .env.example                        # Example env file (in Git)
│   └── .gitignore                          # Git ignore rules
│
├── scripts/                                # Utility Scripts (Git tracked)
│   ├── backup-database.sh                  # Automated daily backup
│   ├── manual-backup.sh                    # Pre-change manual backup
│   ├── restore-database.sh                 # Restore from backup
│   └── setup-project.sh                    # Initial setup script
│
├── data/                                   # DATABASE STORAGE (NOT in Git)
│   ├── postgres/                           # PostgreSQL data files (LIVE DB)
│   │   └── (Docker volume mounts here)     # ~1GB+ in production
│   │
│   ├── backups/                            # Database Backups
│   │   ├── daily/                          # Daily backups (7 days retention)
│   │   ├── weekly/                         # Weekly backups (4 weeks retention)
│   │   └── manual/                         # Manual pre-change backups
│   │
│   └── migrations-archive/                 # Migration snapshots
│       └── (timestamped migration backups)
│
├── y/                                      # BMad Method System (Git tracked)
│   └── (BMad workflows and tools)
│
├── y-ephemeral/                            # Temporary BMad data (NOT in Git)
│   └── (Temporary workflow data)
│
├── .gitignore                              # Root Git ignore
└── README.md                               # Project README

```

### Git Tracking Strategy

```mermaid
graph LR
    A[Git Tracked] --> B[Source Code]
    A --> C[Documentation]
    A --> D[Configuration]
    A --> E[Scripts]

    F[NOT Tracked] --> G[Database Files]
    F --> H[Backups]
    F --> I[Environment Files]
    F --> J[Build Artifacts]

    style A fill:#99ff99
    style F fill:#ff9999
```

**Tracked in Git:**
- ✅ `Investigation/` - Research documents
- ✅ `docs/` - All documentation
- ✅ `supabase/` - Supabase configuration
- ✅ `gilnokie-app/` - Application code
- ✅ `scripts/` - Backup and utility scripts
- ✅ `y/` - BMad Method system

**NOT Tracked (excluded via .gitignore):**
- ❌ `data/` - Database files and backups (too large, not code)
- ❌ `SourceDataFromWade/temp/` - Decompiled files (599 files, not source)
- ❌ `gilnokie-app/.env.local` - Secrets
- ❌ `gilnokie-app/node_modules/` - Dependencies
- ❌ `gilnokie-app/.next/` - Build artifacts
- ❌ `y-ephemeral/` - Temporary workflow data

---

## Supabase Database Location Configuration

### Problem

By default, Supabase CLI stores PostgreSQL data inside Docker's internal volume system, which:
- ❌ Makes backups difficult
- ❌ Data is not easily accessible
- ❌ Cannot place on fast disk
- ❌ Lost if Docker volumes are pruned

### Solution: Custom Data Location

Supabase uses Docker Compose under the hood. We'll configure it to use an external directory.

### Method 1: Configure via Supabase config.toml (Recommended)

**Step 1: Initialize Supabase**

```bash
cd /Users/sam/Dev/Gilnokie
supabase init
```

This creates `/Users/sam/Dev/Gilnokie/supabase/config.toml`

**Step 2: Locate Supabase Docker Compose File**

```bash
# Supabase CLI stores its docker-compose.yml at:
~/.supabase/docker/docker-compose.yml
```

**Step 3: Create Custom Docker Compose Override**

```bash
# Create custom override in your project
mkdir -p supabase/docker
nano supabase/docker/docker-compose.override.yml
```

**Step 4: Add Volume Override**

```yaml
# supabase/docker/docker-compose.override.yml
version: "3.8"

services:
  db:
    volumes:
      # Override the default volume with external directory
      # Option A: Local project directory
      - /Users/sam/Dev/Gilnokie/data/postgres:/var/lib/postgresql/data

      # Option B: Separate fast disk (if available)
      # - /Volumes/FastDisk/gilnokie-data/postgres:/var/lib/postgresql/data
```

**Step 5: Set Environment Variable**

```bash
# Tell Supabase to use custom docker-compose location
export SUPABASE_DOCKER_COMPOSE_FILE="/Users/sam/Dev/Gilnokie/supabase/docker/docker-compose.override.yml"

# Add to your shell profile (~/.zshrc or ~/.bashrc)
echo 'export SUPABASE_DOCKER_COMPOSE_FILE="/Users/sam/Dev/Gilnokie/supabase/docker/docker-compose.override.yml"' >> ~/.zshrc
source ~/.zshrc
```

**Step 6: Start Supabase**

```bash
cd /Users/sam/Dev/Gilnokie
supabase start

# Verify data location
ls -la /Users/sam/Dev/Gilnokie/data/postgres
# Should see PostgreSQL files
```

### Method 2: Direct Docker Volume Mount (Alternative)

If Method 1 doesn't work, use direct Docker commands:

**Step 1: Stop Supabase**

```bash
supabase stop
```

**Step 2: Create Data Directory**

```bash
mkdir -p /Users/sam/Dev/Gilnokie/data/postgres
chmod 700 /Users/sam/Dev/Gilnokie/data/postgres
```

**Step 3: Find Supabase Postgres Container**

```bash
# Start Supabase
supabase start

# Find the container name
docker ps | grep postgres
# Example output: supabase_db_gilnokie
```

**Step 4: Modify Supabase Start Script**

Create a wrapper script:

```bash
# scripts/start-supabase.sh
#!/bin/bash

# Start Supabase normally
supabase start

# Get the Postgres container ID
CONTAINER_ID=$(docker ps --filter "ancestor=supabase/postgres" --format "{{.ID}}")

# Stop the container
docker stop $CONTAINER_ID

# Remove the container (but keep data)
docker rm $CONTAINER_ID

# Recreate with custom volume
docker run -d \
  --name supabase-postgres \
  --network supabase_network_gilnokie \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  -v /Users/sam/Dev/Gilnokie/data/postgres:/var/lib/postgresql/data \
  supabase/postgres:15.1.0.147

echo "Supabase Postgres now using: /Users/sam/Dev/Gilnokie/data/postgres"
```

```bash
chmod +x scripts/start-supabase.sh
./scripts/start-supabase.sh
```

### Method 3: Symlink Docker Volume (Simplest)

**Step 1: Find Default Docker Volume Location**

```bash
# Start Supabase
supabase start

# Find volume
docker volume ls | grep supabase
# Example: supabase_db_data_gilnokie

# Inspect volume
docker volume inspect supabase_db_data_gilnokie
# Note the "Mountpoint" path
```

**Step 2: Stop and Backup**

```bash
supabase stop

# Backup existing data (if any)
sudo cp -r /var/lib/docker/volumes/supabase_db_data_gilnokie/_data /Users/sam/Dev/Gilnokie/data/postgres-backup
```

**Step 3: Remove Volume and Create Symlink**

```bash
# Remove old volume
docker volume rm supabase_db_data_gilnokie

# Create your data directory
mkdir -p /Users/sam/Dev/Gilnokie/data/postgres

# Create symlink from Docker volume location to your directory
sudo mkdir -p /var/lib/docker/volumes/supabase_db_data_gilnokie
sudo ln -s /Users/sam/Dev/Gilnokie/data/postgres /var/lib/docker/volumes/supabase_db_data_gilnokie/_data
```

**Step 4: Restart Supabase**

```bash
supabase start

# Verify
ls -la /Users/sam/Dev/Gilnokie/data/postgres
# Should see PostgreSQL files
```

### Using a Fast External Disk

If you have a fast SSD at `/Volumes/FastDisk/`:

```bash
# Option A: Store data directly on fast disk
mkdir -p /Volumes/FastDisk/gilnokie-data/postgres

# Update docker-compose.override.yml:
# - /Volumes/FastDisk/gilnokie-data/postgres:/var/lib/postgresql/data

# Option B: Symlink from project to fast disk
mkdir -p /Volumes/FastDisk/gilnokie-data/postgres
ln -s /Volumes/FastDisk/gilnokie-data /Users/sam/Dev/Gilnokie/data

# Now /Users/sam/Dev/Gilnokie/data/postgres points to fast disk
```

### Verification

```bash
# Check where data is actually stored
docker inspect supabase-postgres | grep -A 10 Mounts

# Should show:
# "Destination": "/var/lib/postgresql/data",
# "Source": "/Users/sam/Dev/Gilnokie/data/postgres",

# Verify data files exist
ls -lh /Users/sam/Dev/Gilnokie/data/postgres
# Should see: base/ global/ pg_wal/ etc.

# Check disk usage
du -sh /Users/sam/Dev/Gilnokie/data/postgres
# Example: 250M (will grow with data)
```

---

## Initial Setup Steps

### Prerequisites

- macOS (or Linux)
- Docker Desktop installed
- Node.js 20+ installed
- Homebrew (for Supabase CLI)
- Git installed

### Step-by-Step Setup

```mermaid
graph TD
    A[Start] --> B[Create Directory Structure]
    B --> C[Install Supabase CLI]
    C --> D[Initialize Supabase with Custom Data Location]
    D --> E[Create Next.js App]
    E --> F[Install Dependencies]
    F --> G[Initialize Prisma]
    G --> H[Configure Environment Variables]
    H --> I[Start Development]
    I --> J[Setup Backup Scripts]
    J --> K[Ready to Build!]

    style A fill:#e1f5ff
    style K fill:#99ff99
```

### Commands

```bash
# ============================================
# STEP 1: Create Directory Structure
# ============================================
cd /Users/sam/Dev/Gilnokie

# Create data directories (NOT in Git)
mkdir -p data/postgres
mkdir -p data/backups/{daily,weekly,manual}
mkdir -p data/migrations-archive

# Or if using fast disk:
# mkdir -p /Volumes/FastDisk/gilnokie-data/postgres
# ln -s /Volumes/FastDisk/gilnokie-data data

# Create scripts directory
mkdir -p scripts

# Set permissions
chmod 700 data/postgres

# ============================================
# STEP 2: Install Supabase CLI
# ============================================
brew install supabase/tap/supabase

# Verify installation
supabase --version

# ============================================
# STEP 3: Initialize Supabase
# ============================================
supabase init

# This creates: supabase/config.toml

# Create custom Docker override
mkdir -p supabase/docker
cat > supabase/docker/docker-compose.override.yml <<EOF
version: "3.8"

services:
  db:
    volumes:
      - /Users/sam/Dev/Gilnokie/data/postgres:/var/lib/postgresql/data
EOF

# Set environment variable
echo 'export SUPABASE_DOCKER_COMPOSE_FILE="/Users/sam/Dev/Gilnokie/supabase/docker/docker-compose.override.yml"' >> ~/.zshrc
source ~/.zshrc

# Start Supabase
supabase start

# 🎉 Copy the output! You'll need:
# - API URL: http://localhost:54321
# - anon key: eyJhbGc...
# - service_role key: eyJhbGc...
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres

# Verify data location
ls -la data/postgres
# Should see PostgreSQL files

# ============================================
# STEP 4: Create Next.js Application
# ============================================
npx create-next-app@latest gilnokie-app \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd gilnokie-app

# ============================================
# STEP 5: Install Dependencies
# ============================================

# Database & API
npm install @prisma/client prisma
npm install @supabase/supabase-js @supabase/ssr

# State Management
npm install @tanstack/react-query zustand

# Forms
npm install react-hook-form @hookform/resolvers zod

# Tables
npm install @tanstack/react-table @tanstack/react-virtual

# PDF Generation
npm install @react-pdf/renderer

# PWA
npm install @ducanh2912/next-pwa

# UI Components (shadcn/ui)
npx shadcn-ui@latest init

# Add shadcn/ui components
npx shadcn-ui@latest add button input form tabs table dialog toast \
  select checkbox textarea label card badge separator \
  dropdown-menu command combobox sheet

# Development
npm install -D @types/node

# ============================================
# STEP 6: Initialize Prisma
# ============================================
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env

# ============================================
# STEP 7: Configure Environment Variables
# ============================================

# Create .env.local (not tracked in Git)
cat > .env.local <<EOF
# Database (from supabase start output)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<paste-anon-key-here>"
SUPABASE_SERVICE_ROLE_KEY="<paste-service-role-key-here>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
EOF

# Update prisma/schema.prisma
cat > prisma/schema.prisma <<EOF
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Start with simple model, expand later
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
EOF

# Create first migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# ============================================
# STEP 8: Create Docker Configuration
# ============================================

# Dockerfile
cat > Dockerfile <<'EOF'
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
EOF

# docker-compose.yml (for production)
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  next-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gilnokie-app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    env_file:
      - .env.local
    networks:
      - gilnokie-network

networks:
  gilnokie-network:
    external: true
    name: supabase_network_gilnokie
EOF

# ============================================
# STEP 9: Configure Git
# ============================================

# Root .gitignore
cd /Users/sam/Dev/Gilnokie
cat > .gitignore <<'EOF'
# Data files (NOT in Git)
data/
*.sql
*.sql.gz
*.mdb

# Large source files
SourceDataFromWade/temp/

# System files
.DS_Store
EOF

# App .gitignore (already created by create-next-app, but verify)
cd gilnokie-app
cat >> .gitignore <<'EOF'

# Prisma
prisma/dev.db
prisma/dev.db-journal

# PWA
public/sw.js
public/workbox-*.js
public/swe-worker-*.js
EOF

# ============================================
# STEP 10: Start Development
# ============================================
npm run dev

# Visit: http://localhost:3000
# Supabase Studio: http://localhost:54323

# ============================================
# STEP 11: Create Backup Scripts
# ============================================
cd /Users/sam/Dev/Gilnokie/scripts

# Create backup-database.sh (see Backup Strategy section)
# Create manual-backup.sh (see Backup Strategy section)
# Create restore-database.sh (see Backup Strategy section)

chmod +x *.sh

# Test backup
./manual-backup.sh

# ============================================
# COMPLETE! 🎉
# ============================================
echo "Setup complete! Database location:"
du -sh /Users/sam/Dev/Gilnokie/data/postgres
```

### Verification Checklist

```bash
# ✅ Supabase running
supabase status
# Should show: API, DB, Studio all running

# ✅ Database location correct
ls -lh data/postgres
# Should see PostgreSQL files

# ✅ Prisma connected
cd gilnokie-app
npx prisma db push
# Should succeed without errors

# ✅ Next.js running
npm run dev
# Should start on http://localhost:3000

# ✅ Backup working
cd ..
./scripts/manual-backup.sh
ls -lh data/backups/manual/
# Should see .sql.gz file

# ✅ Docker volumes correct
docker volume ls | grep supabase
docker inspect <volume-name> | grep Mountpoint
# Should show your custom path
```

---

## Backup Strategy

### Automated Backup System

```mermaid
graph LR
    A[Cron Job] -->|2 AM Daily| B[backup-database.sh]
    B --> C[Create Daily Backup]
    C --> D{Is Sunday?}
    D -->|Yes| E[Copy to Weekly]
    D -->|No| F[Continue]
    E --> F
    F --> G[Cleanup Old Backups]
    G --> H[7 Days Daily]
    G --> I[4 Weeks Weekly]

    J[Manual Trigger] --> K[manual-backup.sh]
    K --> L[Ask Description]
    L --> M[Create Named Backup]

    style C fill:#99ff99
    style M fill:#99ff99
```

### Backup Scripts

#### 1. Daily Automated Backup

```bash
# /Users/sam/Dev/Gilnokie/scripts/backup-database.sh
#!/bin/bash

#############################################
# Gilnokie Database Backup Script
# Runs daily at 2 AM via cron
# Retention: 7 days daily, 4 weeks weekly
#############################################

# Configuration
BACKUP_DIR="/Users/sam/Dev/Gilnokie/data/backups"
# Or: BACKUP_DIR="/Volumes/FastDisk/gilnokie-data/backups"

POSTGRES_CONTAINER="supabase-db-gilnokie"
DB_NAME="postgres"
DB_USER="postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directories
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/manual"

log "Starting daily backup..."

# Check if container is running
if ! docker ps | grep -q $POSTGRES_CONTAINER; then
    error "Postgres container '$POSTGRES_CONTAINER' is not running!"
    exit 1
fi

# Create daily backup
DAILY_BACKUP="$BACKUP_DIR/daily/gilnokie_$DATE.sql.gz"
log "Creating daily backup: $DAILY_BACKUP"

if docker exec -t $POSTGRES_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > "$DAILY_BACKUP"; then
    log "Daily backup created successfully"

    # Get file size
    SIZE=$(du -h "$DAILY_BACKUP" | cut -f1)
    log "Backup size: $SIZE"
else
    error "Daily backup failed!"
    exit 1
fi

# Weekly backup (on Sundays)
if [ $DAY_OF_WEEK -eq 7 ]; then
    WEEKLY_BACKUP="$BACKUP_DIR/weekly/gilnokie_$DATE.sql.gz"
    log "Sunday detected - creating weekly backup"
    cp "$DAILY_BACKUP" "$WEEKLY_BACKUP"
    log "Weekly backup created: $WEEKLY_BACKUP"
fi

# Cleanup old daily backups (keep 7 days)
log "Cleaning up old daily backups (keeping 7 days)..."
find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +7 -delete
DAILY_COUNT=$(ls -1 "$BACKUP_DIR/daily" | wc -l)
log "Daily backups remaining: $DAILY_COUNT"

# Cleanup old weekly backups (keep 4 weeks = 28 days)
log "Cleaning up old weekly backups (keeping 4 weeks)..."
find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +28 -delete
WEEKLY_COUNT=$(ls -1 "$BACKUP_DIR/weekly" | wc -l)
log "Weekly backups remaining: $WEEKLY_COUNT"

# Disk usage summary
log "Backup storage usage:"
du -sh "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/manual" 2>/dev/null

log "Backup complete! ✅"

# Optional: Send notification (requires setup)
# osascript -e 'display notification "Gilnokie database backed up successfully" with title "Database Backup"'
```

#### 2. Manual Pre-Change Backup

```bash
# /Users/sam/Dev/Gilnokie/scripts/manual-backup.sh
#!/bin/bash

#############################################
# Gilnokie Manual Backup Script
# Use before risky changes (migrations, etc.)
#############################################

BACKUP_DIR="/Users/sam/Dev/Gilnokie/data/backups/manual"
POSTGRES_CONTAINER="supabase-db-gilnokie"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Gilnokie Manual Backup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""

# Ask for backup description
echo -e "${YELLOW}Enter backup description (e.g., 'before-migration', 'before-schema-change'):${NC}"
read -p "> " DESCRIPTION

if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="manual"
fi

# Sanitize description (alphanumeric, dashes, underscores only)
SAFE_DESC=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -cd '[:alnum:]_-')

BACKUP_FILE="$BACKUP_DIR/gilnokie_${DATE}_${SAFE_DESC}.sql.gz"

echo ""
echo -e "${GREEN}Creating backup: ${BACKUP_FILE}${NC}"
echo ""

# Check container
if ! docker ps | grep -q $POSTGRES_CONTAINER; then
    echo -e "${RED}ERROR: Postgres container is not running!${NC}"
    exit 1
fi

# Create backup
if docker exec -t $POSTGRES_CONTAINER pg_dump -U postgres postgres | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo -e "${GREEN}   File: ${BACKUP_FILE}${NC}"
    echo -e "${GREEN}   Size: ${SIZE}${NC}"
    echo ""

    # List recent manual backups
    echo -e "${YELLOW}Recent manual backups:${NC}"
    ls -lht "$BACKUP_DIR" | head -6
    echo ""
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
```

#### 3. Database Restore Script

```bash
# /Users/sam/Dev/Gilnokie/scripts/restore-database.sh
#!/bin/bash

#############################################
# Gilnokie Database Restore Script
# Restore from backup file
#############################################

BACKUP_DIR="/Users/sam/Dev/Gilnokie/data/backups"
POSTGRES_CONTAINER="supabase-db-gilnokie"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}═══════════════════════════════════════════${NC}"
echo -e "${RED}  ⚠️  DATABASE RESTORE - DESTRUCTIVE ⚠️${NC}"
echo -e "${RED}═══════════════════════════════════════════${NC}"
echo ""

# List available backups
echo -e "${YELLOW}Available backups:${NC}"
echo ""
echo -e "${GREEN}DAILY BACKUPS:${NC}"
ls -lht "$BACKUP_DIR/daily" | head -8
echo ""
echo -e "${GREEN}WEEKLY BACKUPS:${NC}"
ls -lht "$BACKUP_DIR/weekly" | head -5
echo ""
echo -e "${GREEN}MANUAL BACKUPS:${NC}"
ls -lht "$BACKUP_DIR/manual" | head -5
echo ""

# Ask for backup file
echo -e "${YELLOW}Enter full path to backup file:${NC}"
read -p "> " BACKUP_FILE

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file not found!${NC}"
    exit 1
fi

# Confirm
echo ""
echo -e "${RED}⚠️  WARNING: This will COMPLETELY REPLACE the current database!${NC}"
echo -e "${YELLOW}Restoring from: ${BACKUP_FILE}${NC}"
echo ""
echo -e "${YELLOW}Are you sure? Type 'RESTORE' to continue:${NC}"
read -p "> " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Cancelled."
    exit 0
fi

# Check container
if ! docker ps | grep -q $POSTGRES_CONTAINER; then
    echo -e "${RED}ERROR: Postgres container is not running!${NC}"
    exit 1
fi

# Backup current database first (safety)
SAFETY_BACKUP="$BACKUP_DIR/manual/pre-restore_$(date +%Y-%m-%d_%H-%M-%S).sql.gz"
echo ""
echo -e "${GREEN}Creating safety backup first...${NC}"
docker exec -t $POSTGRES_CONTAINER pg_dump -U postgres postgres | gzip > "$SAFETY_BACKUP"
echo -e "${GREEN}Safety backup created: ${SAFETY_BACKUP}${NC}"

# Restore
echo ""
echo -e "${GREEN}Restoring database...${NC}"

# Drop and recreate database
docker exec -t $POSTGRES_CONTAINER psql -U postgres -c "DROP DATABASE IF EXISTS postgres WITH (FORCE);"
docker exec -t $POSTGRES_CONTAINER psql -U postgres -c "CREATE DATABASE postgres;"

# Restore from backup
if gunzip -c "$BACKUP_FILE" | docker exec -i $POSTGRES_CONTAINER psql -U postgres -d postgres > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    echo ""

    # Run Prisma migrations to ensure schema is current
    echo -e "${YELLOW}Running Prisma migrations to ensure schema is current...${NC}"
    cd /Users/sam/Dev/Gilnokie/gilnokie-app
    npx prisma migrate deploy

    echo ""
    echo -e "${GREEN}✅ Restore complete!${NC}"
    echo -e "${YELLOW}Safety backup saved at: ${SAFETY_BACKUP}${NC}"
    echo ""
else
    echo -e "${RED}❌ Restore failed!${NC}"
    echo -e "${YELLOW}Restoring from safety backup...${NC}"
    gunzip -c "$SAFETY_BACKUP" | docker exec -i $POSTGRES_CONTAINER psql -U postgres -d postgres
    exit 1
fi
```

### Make Scripts Executable

```bash
cd /Users/sam/Dev/Gilnokie/scripts
chmod +x backup-database.sh
chmod +x manual-backup.sh
chmod +x restore-database.sh

# Test scripts
./manual-backup.sh
```

### Schedule Automated Backups (cron)

```bash
# Open crontab editor
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /Users/sam/Dev/Gilnokie/scripts/backup-database.sh >> /Users/sam/Dev/Gilnokie/data/backups/backup.log 2>&1

# Save and exit

# Verify cron job
crontab -l

# View backup log
tail -f /Users/sam/Dev/Gilnokie/data/backups/backup.log
```

### Backup Retention Policy

```mermaid
gantt
    title Backup Retention Schedule
    dateFormat YYYY-MM-DD

    section Daily Backups
    Day 1 :done, d1, 2025-11-11, 1d
    Day 2 :done, d2, after d1, 1d
    Day 3 :done, d3, after d2, 1d
    Day 4 :done, d4, after d3, 1d
    Day 5 :done, d5, after d4, 1d
    Day 6 :done, d6, after d5, 1d
    Day 7 :done, d7, after d6, 1d
    Day 8+ Deleted :crit, after d7, 1d

    section Weekly Backups
    Week 1 :done, w1, 2025-11-11, 7d
    Week 2 :done, w2, after w1, 7d
    Week 3 :done, w3, after w2, 7d
    Week 4 :done, w4, after w3, 7d
    Week 5+ Deleted :crit, after w4, 7d
```

**Retention Rules:**
- **Daily:** 7 days (1 week)
- **Weekly:** 28 days (4 weeks)
- **Manual:** Never deleted automatically (keep until manually removed)

**Storage Estimate:**
- Initial database: ~100 MB
- Daily backup (compressed): ~20 MB
- 7 daily backups: ~140 MB
- 4 weekly backups: ~80 MB
- Total: ~220 MB (grows with data)

---

## Development Workflow

### Daily Development

```bash
# Morning: Start services
cd /Users/sam/Dev/Gilnokie
supabase start
cd gilnokie-app
npm run dev

# Open in browser
# App: http://localhost:3000
# Supabase Studio: http://localhost:54323

# Make changes...

# Evening: Stop services (optional)
supabase stop
# (Docker containers will persist data)
```

### Making Schema Changes

```bash
cd /Users/sam/Dev/Gilnokie/gilnokie-app

# 1. Manual backup before schema change
cd ..
./scripts/manual-backup.sh
# Description: before-add-job-status-field

# 2. Edit schema
cd gilnokie-app
nano prisma/schema.prisma
# Add/modify models

# 3. Create migration
npx prisma migrate dev --name add_job_status_field

# 4. Prisma generates client automatically

# 5. Update code to use new schema
# Edit your TypeScript files

# 6. Test
npm run dev

# If something goes wrong:
cd ..
./scripts/restore-database.sh
# Select the backup from step 1
```

### Adding New Features

```bash
# 1. Create feature branch (if using Git)
git checkout -b feature/job-card-form

# 2. Manual backup
./scripts/manual-backup.sh
# Description: before-job-card-feature

# 3. Build feature
cd gilnokie-app
# Create components, API routes, etc.

# 4. Test locally
npm run dev

# 5. Commit changes
git add .
git commit -m "Add job card form with 111 controls"

# 6. Merge to main
git checkout main
git merge feature/job-card-form
```

### Debugging Database Issues

```bash
# Connect to Postgres directly
docker exec -it supabase-db-gilnokie psql -U postgres -d postgres

# Run SQL queries
postgres=# \dt  -- List tables
postgres=# SELECT * FROM users;
postgres=# \q  -- Quit

# View Prisma Studio (GUI)
cd gilnokie-app
npx prisma studio
# Opens: http://localhost:5555

# Check database size
docker exec -t supabase-db-gilnokie psql -U postgres -d postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

---

## Disaster Recovery

### Recovery Scenarios

```mermaid
graph TD
    A[Disaster Type?] --> B{What Failed?}
    B -->|App Code| C[Rebuild from Git]
    B -->|Database| D[Restore from Backup]
    B -->|Both| E[Full Recovery]
    B -->|Docker Volume| F[Restore from Backup]

    C --> C1[git clone]
    C --> C2[npm install]
    C --> C3[npm run dev]
    C --> G[Done - 5 min]

    D --> D1[Stop Supabase]
    D --> D2[Clear corrupt data]
    D --> D3[Restore backup]
    D --> D4[Restart]
    D --> H[Done - 10 min]

    E --> E1[Rebuild App]
    E --> E2[Restore Database]
    E --> I[Done - 15 min]

    style G fill:#99ff99
    style H fill:#99ff99
    style I fill:#99ff99
```

### Scenario 1: App Code Corrupted (Database Intact)

**Symptoms:**
- App won't start
- Build errors
- Corrupted node_modules

**Solution: Rebuild from Git (5 minutes)**

```bash
# 1. Database is safe at: /Users/sam/Dev/Gilnokie/data/postgres
# No action needed for database

# 2. Delete corrupted app
cd /Users/sam/Dev/Gilnokie
rm -rf gilnokie-app

# 3. Clone from Git
git clone <your-repo-url> gilnokie-app
cd gilnokie-app

# 4. Install dependencies
npm install

# 5. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 6. Generate Prisma Client
npx prisma generate

# 7. Start app
npm run dev

# ✅ Done! Database unchanged, all data intact
```

### Scenario 2: Database Corrupted (App Code Intact)

**Symptoms:**
- Cannot connect to database
- Data missing or corrupted
- Postgres container won't start

**Solution: Restore from Backup (10 minutes)**

```bash
# 1. Stop Supabase
cd /Users/sam/Dev/Gilnokie
supabase stop

# 2. Backup corrupted data (for forensics)
mv data/postgres data/postgres-corrupted-$(date +%Y-%m-%d)

# 3. Create fresh directory
mkdir -p data/postgres
chmod 700 data/postgres

# 4. Restart Supabase (creates fresh database)
supabase start

# 5. Restore from backup
./scripts/restore-database.sh
# Select most recent backup:
# data/backups/daily/gilnokie_2025-11-11_02-00-00.sql.gz

# 6. Run migrations (if any pending)
cd gilnokie-app
npx prisma migrate deploy

# 7. Test connection
npx prisma studio

# ✅ Done! Database restored
```

### Scenario 3: Complete System Loss (New Machine)

**Requirements:**
- Your Git repository backup
- Your database backup (from cloud storage, external drive, etc.)

**Solution: Full Recovery (15 minutes)**

```bash
# ============================================
# STEP 1: Setup Machine
# ============================================
# Install: Docker Desktop, Node.js, Homebrew
brew install supabase/tap/supabase

# ============================================
# STEP 2: Restore Project
# ============================================
cd /Users/sam/Dev
mkdir Gilnokie
cd Gilnokie

# Clone repository
git clone <your-repo-url> gilnokie-app

# ============================================
# STEP 3: Restore Database Backup
# ============================================
# Copy backed-up data from cloud/external drive
# Example: From external drive to local
cp -r /Volumes/Backup/gilnokie-data/backups data/

# Create postgres directory
mkdir -p data/postgres
chmod 700 data/postgres

# ============================================
# STEP 4: Initialize Supabase
# ============================================
supabase init

# Create custom docker override
mkdir -p supabase/docker
cat > supabase/docker/docker-compose.override.yml <<EOF
version: "3.8"
services:
  db:
    volumes:
      - /Users/sam/Dev/Gilnokie/data/postgres:/var/lib/postgresql/data
EOF

# Start Supabase
supabase start

# ============================================
# STEP 5: Restore Database
# ============================================
./scripts/restore-database.sh
# Select your backup file

# ============================================
# STEP 6: Setup Application
# ============================================
cd gilnokie-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with Supabase keys from `supabase start` output

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# ============================================
# STEP 7: Test
# ============================================
npm run dev

# Visit: http://localhost:3000
# ✅ Done! Full system restored
```

### Scenario 4: Docker Volume Pruned Accidentally

**Symptoms:**
- `docker volume prune` deleted Supabase volumes
- Data directory is empty or missing

**Solution: Restore from Backup**

```bash
# 1. Your data directory should still be intact
ls -la /Users/sam/Dev/Gilnokie/data/postgres
# If files present, no restore needed

# 2. If data directory is empty:
./scripts/restore-database.sh
# Select most recent backup

# 3. Restart Supabase
supabase start

# ✅ Done!
```

---

## Docker Configuration

### Development vs Production

```mermaid
graph LR
    subgraph Development
        A[Supabase CLI] -->|manages| B[Docker Compose]
        B --> C[Postgres Container]
        B --> D[Auth Container]
        B --> E[Studio Container]
        F[Next.js] -->|npm run dev| G[Local Port 3000]
        C -->|Volume Mount| H[/data/postgres]
    end

    subgraph Production
        I[Docker Compose] --> J[Postgres Container]
        I --> K[Next.js Container]
        J -->|Volume Mount| L[/data/postgres]
    end

    style Development fill:#e1f5ff
    style Production fill:#ffe1e1
```

### Development Setup

**Managed by Supabase CLI:**

```bash
# Start all services
supabase start

# This creates:
# - supabase-db-gilnokie (Postgres)
# - supabase-auth-gilnokie (GoTrue Auth)
# - supabase-rest-gilnokie (PostgREST API)
# - supabase-studio-gilnokie (Admin UI)
# - supabase-storage-gilnokie (File storage)
# - supabase-realtime-gilnokie (Real-time subscriptions)
# - supabase-kong-gilnokie (API Gateway)

# Next.js runs separately
cd gilnokie-app
npm run dev
```

### Production Setup

**Custom Docker Compose:**

```yaml
# /Users/sam/Dev/Gilnokie/gilnokie-app/docker-compose.prod.yml
version: '3.8'

services:
  # PostgreSQL (from Supabase image)
  postgres:
    image: supabase/postgres:15.1.0.147
    container_name: gilnokie-postgres-prod
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
    volumes:
      - /Users/sam/Dev/Gilnokie/data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - gilnokie-prod

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gilnokie-app-prod
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - gilnokie-prod

  # Supabase Auth (if needed)
  auth:
    image: supabase/gotrue:v2.99.0
    container_name: gilnokie-auth-prod
    restart: unless-stopped
    ports:
      - "9999:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
      GOTRUE_SITE_URL: ${NEXT_PUBLIC_APP_URL}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - gilnokie-prod

networks:
  gilnokie-prod:
    driver: bridge
```

### Production Deployment

```bash
# 1. Build production image
cd /Users/sam/Dev/Gilnokie/gilnokie-app
docker-compose -f docker-compose.prod.yml build

# 2. Create production .env
cat > .env.prod <<EOF
POSTGRES_PASSWORD=<strong-password>
NEXT_PUBLIC_SUPABASE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>
JWT_SECRET=<strong-jwt-secret>
NEXT_PUBLIC_APP_URL=https://your-domain.com
EOF

# 3. Run migrations
npx prisma migrate deploy

# 4. Start production containers
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 5. Verify
docker ps
curl http://localhost:3000

# 6. Setup reverse proxy (nginx/caddy) for HTTPS
# (Production setup - separate guide)
```

### Docker Commands Reference

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker logs gilnokie-postgres
docker logs -f gilnokie-app  # Follow mode

# Stop containers
docker stop gilnokie-postgres
docker stop gilnokie-app

# Start containers
docker start gilnokie-postgres
docker start gilnokie-app

# Restart container
docker restart gilnokie-postgres

# Remove container (data persists if using volume)
docker rm gilnokie-postgres

# View volumes
docker volume ls

# Inspect volume
docker volume inspect supabase_db_data_gilnokie

# View networks
docker network ls

# Inspect network
docker network inspect supabase_network_gilnokie

# Execute command in container
docker exec -it gilnokie-postgres psql -U postgres

# View container resource usage
docker stats

# Clean up (CAREFUL - can delete volumes)
docker system prune  # Safe - removes stopped containers, unused networks
docker system prune -a  # Removes unused images too
docker volume prune  # DANGEROUS - removes unused volumes (data loss!)
```

---

## Summary Checklist

### Initial Setup ✅

- [ ] Directory structure created
- [ ] Supabase CLI installed
- [ ] Supabase initialized with custom data location
- [ ] Data directory configured (on fast disk if available)
- [ ] Next.js project created
- [ ] All dependencies installed
- [ ] Prisma initialized
- [ ] Environment variables configured
- [ ] First migration created
- [ ] Backup scripts created and tested
- [ ] Cron job scheduled (optional)
- [ ] Git repository initialized

### Verification ✅

- [ ] Supabase running (`supabase status`)
- [ ] Database files in correct location (`ls data/postgres`)
- [ ] Prisma can connect (`npx prisma db push`)
- [ ] Next.js starts (`npm run dev`)
- [ ] Manual backup works (`./scripts/manual-backup.sh`)
- [ ] Docker volumes correct (`docker volume ls`)

### Ready to Build ✅

- [ ] Can create new migrations
- [ ] Can restore from backup
- [ ] Development workflow understood
- [ ] Disaster recovery plan in place

---

## Quick Reference

### Key Directories

| Path | Purpose | Git Tracked | Backup |
|------|---------|-------------|--------|
| `/Users/sam/Dev/Gilnokie/` | Project root | Selective | No |
| `Investigation/` | Research docs | ✅ Yes | No |
| `docs/` | Documentation | ✅ Yes | No |
| `supabase/` | Supabase config | ✅ Yes | No |
| `gilnokie-app/` | Next.js app | ✅ Yes | No |
| `scripts/` | Backup scripts | ✅ Yes | No |
| `data/postgres/` | Database files | ❌ No | ✅ Yes |
| `data/backups/` | DB backups | ❌ No | ✅ Yes |

### Key Commands

```bash
# Start development
supabase start
cd gilnokie-app && npm run dev

# Make schema changes
npx prisma migrate dev --name <name>

# Manual backup
./scripts/manual-backup.sh

# Restore database
./scripts/restore-database.sh

# View database
npx prisma studio

# Check disk usage
du -sh data/postgres data/backups
```

### Key URLs

- **App:** http://localhost:3000
- **Supabase Studio:** http://localhost:54323
- **Prisma Studio:** http://localhost:5555 (when running)
- **API:** http://localhost:3000/api/*

### Key Files

- **Environment:** `gilnokie-app/.env.local`
- **Schema:** `gilnokie-app/prisma/schema.prisma`
- **Config:** `supabase/config.toml`
- **Docker Override:** `supabase/docker/docker-compose.override.yml`

---

## Next Steps

1. **Complete Initial Setup** (follow commands in this guide)
2. **Test Backup/Restore** (verify disaster recovery works)
3. **Start Development** (begin building features)
4. **Create PRD** (product requirements document)
5. **Design Architecture** (technical architecture decisions)
6. **Build Phase 1** (foundation - auth, basic CRUD)

---

**Questions or Issues?**

Refer to:
- [Technical Research Report](research-technical-2025-11-11.md) - Stack validation
- [BUILD_PLAN.md](../Investigation/BUILD_PLAN.md) - Original technical plan
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs

---

_Last Updated: 2025-11-11_