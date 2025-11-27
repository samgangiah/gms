# Docker-Only Deployment (No Node.js Required)

Deploy Gilnokie GMS using **only Docker** - no Node.js or Supabase CLI installation needed.

## Prerequisites on VPS

- ✅ Docker installed
- ✅ Docker Compose installed
- ✅ Traefik running with `proxy` network
- ✅ DNS pointing `gms.digitalrain.cloud` to your VPS

## Step-by-Step Deployment

### 1. Clone Repository

```bash
cd ~/vps/projects
git clone https://github.com/samgangiah/gms.git
cd gms
```

### 2. Create Environment File

```bash
cp .env.production.example .env
nano .env
```

### 3. Generate JWT Secret

You need a strong JWT secret for Supabase. Generate one:

```bash
# Generate a random 64-character string
openssl rand -base64 48
```

Copy the output.

### 4. Configure Environment Variables

Edit `.env` and set these values:

```env
# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE_32_CHARS_MIN
POSTGRES_DB=postgres

# Domain
DOMAIN=gms.digitalrain.cloud

# JWT Secret (from step 3)
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE

# Supabase Keys (these will be auto-generated - use placeholders for now)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# API Configuration
API_EXTERNAL_URL=https://gms.digitalrain.cloud
SITE_URL=https://gms.digitalrain.cloud
```

**Note:** The `ANON_KEY` and `SERVICE_ROLE_KEY` above are default Supabase demo keys. For production, you should generate proper keys, but these will work for testing.

### 5. Build and Start Services

```bash
# Build the application
docker compose build

# Start all services
docker compose up -d
```

This will start:
- PostgreSQL database
- Supabase services (Auth, API Gateway, Storage, etc.)
- Your Next.js application
- Supabase Studio (admin UI)

### 6. Check Services Status

```bash
docker compose ps
```

You should see all services as "Up" and healthy.

### 7. Run Database Migrations

```bash
# Wait for database to be ready
sleep 10

# Run migrations
docker compose exec app npx prisma migrate deploy
```

### 8. Access Your Application

- **Main App:** https://gms.digitalrain.cloud
- **Supabase Studio:** https://studio.gms.digitalrain.cloud

## Generating Production JWT Keys (Optional but Recommended)

For better security, generate your own JWT keys:

### Install `jose` CLI tool in a temporary container:

```bash
docker run --rm -it node:20-alpine sh -c "
npm install -g jose-cli
jose newkey -s 256 -t oct -a HS256 | jose fmt -j
"
```

This will output something like:
```json
{
  "kty": "oct",
  "kid": "...",
  "alg": "HS256",
  "k": "YOUR_SECRET_KEY_HERE"
}
```

Use the `k` value as your `JWT_SECRET`.

Then generate the keys:

```bash
# Replace YOUR_JWT_SECRET with the value from above
JWT_SECRET="YOUR_JWT_SECRET_HERE"

# Generate anon key (expires in 10 years)
docker run --rm node:20-alpine sh -c "
npm install -g jsonwebtoken
node -e \"
const jwt = require('jsonwebtoken');
const secret = '$JWT_SECRET';
const token = jwt.sign({
  iss: 'supabase',
  ref: 'gms',
  role: 'anon',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
}, secret, { algorithm: 'HS256' });
console.log('ANON_KEY:', token);
\"
"

# Generate service role key
docker run --rm node:20-alpine sh -c "
npm install -g jsonwebtoken
node -e \"
const jwt = require('jsonwebtoken');
const secret = '$JWT_SECRET';
const token = jwt.sign({
  iss: 'supabase',
  ref: 'gms',
  role: 'service_role',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
}, secret, { algorithm: 'HS256' });
console.log('SERVICE_ROLE_KEY:', token);
\"
"
```

Update your `.env` with these new keys, then restart:

```bash
docker compose restart
```

## Management Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f auth
docker compose logs -f db
```

### Restart Services

```bash
docker compose restart
```

### Stop Services

```bash
docker compose down
```

### Update Deployment

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Run new migrations
docker compose exec app npx prisma migrate deploy
```

### Database Backup

```bash
# Create backup
docker compose exec db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20241127.sql | docker compose exec -T db psql -U postgres postgres
```

### Access Database Console

```bash
docker compose exec db psql -U postgres -d postgres
```

## Troubleshooting

### App won't start

```bash
# Check logs
docker compose logs app

# Common issues:
# 1. Missing environment variables - check .env file
# 2. Database not ready - wait 30 seconds and try again
# 3. Build failed - check Docker has enough disk space
```

### Can't access application

```bash
# Check Traefik routing
docker logs traefik | grep gilnokie

# Verify proxy network
docker network inspect proxy

# Check if app container is on proxy network
docker inspect gms-app | grep proxy
```

### Database connection errors

```bash
# Check database is running
docker compose exec db pg_isready

# Check database logs
docker compose logs db

# Verify credentials in .env match
docker compose exec app env | grep DATABASE_URL
```

## Architecture

```
Internet
    ↓
Traefik (HTTPS/SSL)
    ↓
Kong API Gateway (:8000) ─┐
    ↓                      │
Next.js App (:3000) ←──────┤
    ↓                      │
PostgreSQL (:5432) ←───────┘
    ↑
Supabase Auth/Storage/Realtime
```

## What's Running

| Service | Container Name | Ports | Purpose |
|---------|---------------|-------|---------|
| PostgreSQL | gms-db | 5432 | Database |
| Kong | gms-kong | 8000 | API Gateway |
| GoTrue | gms-auth | 9999 | Authentication |
| PostgREST | gms-rest | 3000 | REST API |
| Realtime | gms-realtime | 4000 | WebSocket/Realtime |
| Storage | gms-storage | 5000 | File Storage |
| Studio | gms-studio | 3000 | Admin UI |
| Next.js App | gms-app | 3000 | Your Application |

## Security Notes

1. **Change default passwords** in `.env`
2. **Generate production JWT keys** (see above)
3. **Restrict Studio access** - only accessible via studio subdomain
4. **Enable SSL** - Traefik handles this automatically
5. **Regular backups** - Set up automated database backups
6. **Update images** - Periodically pull latest Supabase images

---

**No Node.js installation required!** Everything runs in Docker containers.
