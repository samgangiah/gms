# Supabase VPS Setup Guide

## Overview

Your app uses Supabase CLI for local Supabase instance. On the VPS, we'll:
1. Install Supabase CLI
2. Run `supabase start` to launch Supabase containers
3. Configure your app to connect to local Supabase

## Step 1: Install Supabase CLI on VPS

SSH into your VPS and run:

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

## Step 2: Initialize Supabase in Project

```bash
cd ~/vps/projects/gms

# Copy supabase configuration from your project
# (This is already in your Git repo, so it should be there)
ls -la supabase/

# Start Supabase
cd supabase
supabase start
```

This will start all Supabase services (takes 2-5 minutes first time):
- PostgreSQL (port 54322)
- Kong API Gateway (port 54321)
- GoTrue Auth (port 9999)
- PostgREST (port 3000)
- Realtime (port 4000)
- Storage (port 5000)
- Studio UI (port 54323)

## Step 3: Get Supabase Credentials

After `supabase start` completes, it will display:

```
API URL: http://127.0.0.1:54321
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Publishable key: eyJh...
Secret key: eyJh...
```

## Step 4: Configure .env

Edit your `.env` file in the project root:

```bash
cd ~/vps/projects/gms
nano .env
```

Update with Supabase values from `supabase start`:

```env
# PostgreSQL Database (from docker-compose.yml)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=gilnokie

# Domain
DOMAIN=gms.digitalrain.cloud

# Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_role_key_here
```

**IMPORTANT:** The Supabase keys change each time you run `supabase start`, so save them!

## Step 5: Update docker-compose.yml for VPS

The current docker-compose.yml needs a small update. Instead of running our own PostgreSQL, we'll use Supabase's PostgreSQL.

Edit `docker-compose.yml` and **remove the postgres service** or comment it out, then update the app's DATABASE_URL:

```yaml
services:
  # PostgreSQL is handled by Supabase CLI (port 54322)
  # postgres: ... REMOVE THIS ENTIRE SERVICE

  app:
    environment:
      # Connect to Supabase's PostgreSQL
      DATABASE_URL: postgresql://postgres:postgres@host.docker.internal:54322/postgres?schema=public
      DIRECT_URL: postgresql://postgres:postgres@host.docker.internal:54322/postgres?schema=public
      NEXT_PUBLIC_SUPABASE_URL: http://host.docker.internal:54321
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
```

## Step 6: Deploy

```bash
cd ~/vps/projects/gms

# Make sure Supabase is running
cd supabase && supabase status
cd ..

# Build and start your app
docker compose build
docker compose up -d

# Run database migrations
docker compose exec app npx prisma migrate deploy
```

## Step 7: Verify

1. **Check Supabase is running:**
   ```bash
   supabase status
   ```

2. **Check your app:**
   ```bash
   docker compose ps
   docker compose logs app
   ```

3. **Visit your site:**
   - App: https://gms.digitalrain.cloud
   - Supabase Studio: http://your-vps-ip:54323

## Managing Supabase

### Start Supabase
```bash
cd ~/vps/projects/gms/supabase
supabase start
```

### Stop Supabase
```bash
cd ~/vps/projects/gms/supabase
supabase stop
```

### Check Status
```bash
supabase status
```

### View Database
```bash
# Via Studio (web UI)
# Visit: http://your-vps-ip:54323

# Via psql
supabase db psql
```

## Production Considerations

### 1. Make Supabase Start on Boot

Create a systemd service:

```bash
sudo nano /etc/systemd/system/supabase-gilnokie.service
```

Content:
```ini
[Unit]
Description=Supabase for Gilnokie
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/coder/vps/projects/gms/supabase
ExecStart=/usr/bin/npm exec -g supabase start
ExecStop=/usr/bin/npm exec -g supabase stop
User=coder

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable supabase-gilnokie
sudo systemctl start supabase-gilnokie
```

### 2. Secure Supabase Studio

Studio runs on port 54323. Either:
- Block external access via firewall
- Set up SSH tunnel to access it

```bash
# On your local machine:
ssh -L 54323:localhost:54323 coder@your-vps-ip

# Then visit: http://localhost:54323
```

### 3. Backup Database

```bash
# Create backup
supabase db dump -f backup_$(date +%Y%m%d).sql

# Restore backup
supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres < backup_20241127.sql
```

## Troubleshooting

### Supabase won't start
```bash
# Check Docker is running
docker ps

# Check for port conflicts
sudo lsof -i :54321
sudo lsof -i :54322

# Reset Supabase
supabase stop
supabase start
```

### App can't connect to Supabase
```bash
# From inside app container, test connection
docker compose exec app curl http://host.docker.internal:54321

# Check Supabase logs
supabase logs
```

### Database migrations fail
```bash
# Check database is accessible
supabase db psql

# Manually run migrations
docker compose exec app npx prisma migrate deploy
```

---

**Next:** Follow these steps on your VPS to get Supabase running, then deploy your app!
