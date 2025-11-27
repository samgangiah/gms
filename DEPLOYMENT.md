# Gilnokie - VPS Deployment Guide (Docker + Traefik)

Complete deployment guide for deploying the Gilnokie textile manufacturing system to a Hostinger VPS with Docker and Traefik.

## Prerequisites

- Hostinger VPS with Docker installed ✅
- Traefik reverse proxy running ✅
- Domain name pointed to your VPS
- Bitbucket repository access
- Supabase account (recommended) or self-hosted PostgreSQL

## Architecture Overview

```
Internet → Traefik (SSL/Reverse Proxy) → Next.js App → PostgreSQL
                                      ↓
                                  Supabase API (Auth)
```

## Step 1: Prepare Your VPS

### 1.1 SSH into Your VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Create Project Directory

```bash
mkdir -p /opt/gilnokie
cd /opt/gilnokie
```

### 1.3 Verify Docker and Traefik

```bash
# Check Docker is running
docker --version
docker ps

# Verify proxy network exists (used by Traefik)
docker network ls | grep proxy

# Verify Traefik is running
docker ps | grep traefik
```

## Step 2: Set Up Git Authentication

### 2.1 Generate SSH Key (if needed)

```bash
ssh-keygen -t ed25519 -C "vps-deployment"
cat ~/.ssh/id_ed25519.pub
```

### 2.2 Add SSH Key to Bitbucket

1. Copy the public key output from above
2. Go to Bitbucket → Settings → SSH Keys
3. Add the new SSH key

### 2.3 Clone Repository

```bash
cd /opt/gilnokie
git clone git@github.com:samgangiah/gms.git .
```

## Step 3: Configure Environment Variables

### 3.1 Create Production Environment File

```bash
cp .env.production .env
nano .env
```

### 3.2 Update Environment Variables

Update the following in `.env`:

```env
# Database (strong password!)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_super_secure_password_here_min_32_chars
POSTGRES_DB=gilnokie

# Your domain
DOMAIN=gilnokie.yourdomain.com

# Supabase (Option 1 - Recommended: Use Supabase Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase

# Database URLs (update password to match POSTGRES_PASSWORD)
DATABASE_URL=postgresql://postgres:your_super_secure_password_here@postgres:5432/gilnokie?schema=public
DIRECT_URL=postgresql://postgres:your_super_secure_password_here@postgres:5432/gilnokie?schema=public
```

### 3.3 Get Supabase Credentials

1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Verify DNS Configuration

Your DNS should already be configured:

```
gms.digitalrain.cloud → Your VPS IP
```

Verify DNS is working:
```bash
ping gms.digitalrain.cloud
# Should return your VPS IP address
```

## Step 5: Build and Deploy

### 5.1 Build Docker Image

```bash
cd /opt/gilnokie
docker compose build
```

This will take 5-10 minutes on first build.

### 5.2 Start Services

```bash
docker compose up -d
```

### 5.3 Verify Services Are Running

```bash
docker compose ps
```

You should see:
- `gilnokie-postgres` (healthy)
- `gilnokie-app` (up)

### 5.4 Check Logs

```bash
# Check all logs
docker compose logs -f

# Check only app logs
docker compose logs -f app

# Check only database logs
docker compose logs -f postgres
```

## Step 6: Run Database Migrations

```bash
# Execute migrations inside the container
docker compose exec app npx prisma migrate deploy
```

## Step 7: Verify Deployment

### 7.1 Check Traefik Dashboard

If you have Traefik dashboard enabled, verify that your service appears in the routing rules.

### 7.2 Access Your Application

Visit: `https://gms.digitalrain.cloud`

You should see:
- ✅ HTTPS (automatic via Traefik + Let's Encrypt)
- ✅ Your Next.js application
- ✅ Login page (Supabase authentication)

## Step 8: Create First User (If Needed)

If you need to create the first admin user:

```bash
# Option 1: Use Supabase Dashboard
# Go to your Supabase project → Authentication → Add User

# Option 2: Sign up through the app
# Visit https://gms.digitalrain.cloud and use the signup form
```

## Deployment Commands Reference

### Starting Services

```bash
cd /opt/gilnokie
docker compose up -d
```

### Stopping Services

```bash
docker compose down
```

### Restarting Services

```bash
docker compose restart
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100
```

### Updating the Application

```bash
cd /opt/gilnokie

# Pull latest code from Bitbucket
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Run any new migrations
docker compose exec app npx prisma migrate deploy
```

### Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres gilnokie > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose exec -T postgres psql -U postgres gilnokie < backup_20241126_120000.sql
```

### Accessing PostgreSQL Console

```bash
docker compose exec postgres psql -U postgres -d gilnokie
```

## Troubleshooting

### Issue: Container Won't Start

```bash
# Check logs for errors
docker compose logs app

# Common fixes:
# 1. Check environment variables
cat .env

# 2. Verify database is healthy
docker compose ps

# 3. Check if port is already in use
docker ps | grep 3000
```

### Issue: Cannot Connect to Database

```bash
# Check PostgreSQL is running
docker compose exec postgres pg_isready

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL matches POSTGRES_PASSWORD
cat .env | grep POSTGRES_PASSWORD
cat .env | grep DATABASE_URL
```

### Issue: Traefik Not Routing Traffic

```bash
# Verify traefik network exists
docker network ls | grep traefik

# Check if app is on traefik network
docker inspect gilnokie-app | grep traefik

# Verify domain is correct
cat .env | grep DOMAIN

# Check Traefik logs
docker logs traefik
```

### Issue: SSL Certificate Not Working

- Ensure DNS is properly configured
- Wait 5-15 minutes for Let's Encrypt certificate generation
- Check Traefik logs: `docker logs traefik`
- Verify your Traefik configuration has Let's Encrypt enabled

### Issue: Build Fails

```bash
# Clear Docker build cache
docker system prune -a

# Rebuild with no cache
docker compose build --no-cache

# Check Dockerfile syntax
docker compose config
```

## Monitoring

### Resource Usage

```bash
# Check container resource usage
docker stats

# Check disk space
df -h

# Check Docker disk usage
docker system df
```

### Application Health

```bash
# Check if app is responding
curl http://localhost:3000

# Check database connections
docker compose exec postgres psql -U postgres -d gilnokie -c "SELECT count(*) FROM pg_stat_activity;"
```

## Security Checklist

- [ ] Changed default `POSTGRES_PASSWORD` to strong password (32+ chars)
- [ ] Environment file (`.env`) has restricted permissions: `chmod 600 .env`
- [ ] Supabase RLS (Row Level Security) policies enabled
- [ ] Firewall configured to allow only ports 80, 443, and SSH
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] Regular database backups scheduled
- [ ] Docker containers running as non-root user (already configured)
- [ ] Traefik configured with security headers

## Performance Optimization

### Enable Docker Logging Limits

Add to `docker-compose.yml` for each service:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Database Connection Pooling

The app already uses Prisma's connection pooling. Monitor with:

```bash
docker compose exec postgres psql -U postgres -d gilnokie -c "SELECT * FROM pg_stat_activity;"
```

## Backup Strategy

### Automated Daily Backups

Create a cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/gilnokie && docker compose exec -T postgres pg_dump -U postgres gilnokie | gzip > /backups/gilnokie_$(date +\%Y\%m\%d).sql.gz
```

### Keep Last 7 Days of Backups

```bash
# Add to cron after backup
5 2 * * * find /backups -name "gilnokie_*.sql.gz" -mtime +7 -delete
```

## Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Verify configuration: `docker compose config`
- Review this guide's troubleshooting section

## Version History

- **v0.1.0** - Initial Docker deployment setup with Traefik integration
- **Date**: November 26, 2024

---

**Created for**: Gilnokie Textile Manufacturing System
**Platform**: Hostinger VPS with Docker + Traefik
