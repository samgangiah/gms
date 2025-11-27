# Docker Hub Deployment Guide

Deploy Gilnokie GMS using pre-built Docker images from Docker Hub - **no building on VPS required!**

## Why Use Docker Hub?

- ✅ **Fast deployment** - Pull pre-built image in 30 seconds
- ✅ **No VPS resources wasted** - Build on your powerful local machine
- ✅ **Consistent builds** - Same image everywhere
- ✅ **Save VPS memory** - No npm/build process eating RAM

## One-Time Setup

### 1. Create Docker Hub Account (Free)

1. Go to https://hub.docker.com/signup
2. Create free account
3. Verify your email

### 2. Login to Docker Hub Locally

```bash
docker login
# Enter your Docker Hub username and password
```

## Deployment Workflow

### On Your LOCAL Machine:

#### 1. Build and Push to Docker Hub

```bash
cd /Users/sam/Dev/Gilnokie
./build-and-push.sh
```

This will:
- Build the Docker image on your local machine
- Tag it with timestamp + 'latest'
- Push to Docker Hub (samgfls/gilnokie-gms)
- Takes 2-5 minutes

#### 2. Commit and Push Code Changes

```bash
git add -A
git commit -m "Your changes"
git push deploy main
```

### On Your VPS:

#### 1. Pull Latest Code

```bash
cd /opt/vps/projects/gms
git pull
```

#### 2. Configure Environment (First Time Only)

```bash
# Create .env from template
cp .env.production.example .env

# Edit with your credentials
nano .env
```

**Required in `.env`:**
```env
# Strong password
POSTGRES_PASSWORD=your_strong_password_32chars_minimum

# Generate with: openssl rand -base64 48
JWT_SECRET=your_generated_jwt_secret_here

# Domain
DOMAIN=gms.digitalrain.cloud

# Supabase keys (demo values work for testing)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# API URLs
API_EXTERNAL_URL=https://gms.digitalrain.cloud
SITE_URL=https://gms.digitalrain.cloud
```

#### 3. Deploy with Docker Hub Image

```bash
# Use the docker-compose file configured for Docker Hub
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d

# Run database migrations
docker compose -f docker-compose.hub.yml exec app npx prisma migrate deploy
```

**That's it!** Takes about 1 minute total.

## Daily Update Workflow

When you make changes to your app:

### 1. Local: Build & Push
```bash
./build-and-push.sh
git push deploy main
```

### 2. VPS: Pull & Restart
```bash
cd /opt/vps/projects/gms
git pull
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
docker compose -f docker-compose.hub.yml exec app npx prisma migrate deploy
```

## Management Commands

All commands use `-f docker-compose.hub.yml`:

### View Logs
```bash
docker compose -f docker-compose.hub.yml logs -f app
```

### Restart Services
```bash
docker compose -f docker-compose.hub.yml restart
```

### Stop Services
```bash
docker compose -f docker-compose.hub.yml down
```

### Database Backup
```bash
docker compose -f docker-compose.hub.yml exec db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

## Making .env Easier (Optional)

Create a symlink so you don't need `-f docker-compose.hub.yml` every time:

```bash
cd /opt/vps/projects/gms
ln -sf docker-compose.hub.yml docker-compose.override.yml
```

Now you can use normal `docker compose` commands:
```bash
docker compose pull
docker compose up -d
docker compose logs -f app
```

## Troubleshooting

### Image pull fails
```bash
# Check image exists
docker search samgangiah/gilnokie-gms

# Try pulling manually
docker pull samgangiah/gilnokie-gms:latest
```

### "No space left on device"
```bash
# Clean up old images
docker system prune -a
```

### App won't start
```bash
# Check logs
docker compose -f docker-compose.hub.yml logs app

# Verify environment variables
docker compose -f docker-compose.hub.yml exec app env | grep SUPABASE
```

## Advantages Over Building on VPS

| Aspect | Docker Hub | Build on VPS |
|--------|-----------|--------------|
| Deploy Time | 1 minute | 1+ hour |
| VPS RAM Usage | Minimal | 2GB+ |
| Build Reliability | Consistent | Can fail with low resources |
| Updates | Pull new image | Full rebuild |

## Security Note

The Docker Hub image is **public**. If you need it private:

1. Go to https://hub.docker.com/r/samgangiah/gilnokie-gms/settings
2. Click "Make Private" (free for 1 private repo)

Your sensitive data (passwords, keys) are still safe - they're in `.env`, not in the image.

---

**Ready to deploy?** Run `./build-and-push.sh` on your local machine!
