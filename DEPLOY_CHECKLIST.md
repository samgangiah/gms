# Quick Deployment Checklist for digitalrain.cloud VPS

## Pre-Deployment Checklist

- [x] DNS configured: `gms.digitalrain.cloud` → VPS IP
- [x] GitHub repository created: `samgangiah/gms`
- [x] Code pushed to GitHub
- [x] Docker configured for existing Traefik setup
- [ ] Supabase project created
- [ ] SSH access to VPS verified

## Deployment Steps

### 1. SSH to VPS
```bash
ssh root@your-vps-ip
```

### 2. Create Project Directory
```bash
mkdir -p /opt/gilnokie
cd /opt/gilnokie
```

### 3. Clone Repository
```bash
git clone git@github.com:samgangiah/gms.git .
```

### 4. Configure Environment
```bash
cp .env.production.example .env
nano .env
```

**Required values in `.env`:**
- [ ] `POSTGRES_PASSWORD` - Create strong password (32+ chars)
- [ ] `DOMAIN=gms.digitalrain.cloud` (already set)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - From Supabase dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard

### 5. Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Create new project OR use existing
3. Go to Settings → API
4. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 6. Build and Deploy
```bash
# Build the Docker image
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f

# Run database migrations
docker compose exec app npx prisma migrate deploy
```

### 7. Verify Deployment

- [ ] Check containers running: `docker compose ps`
- [ ] Check Traefik routing: `docker logs traefik | grep gilnokie`
- [ ] Visit https://gms.digitalrain.cloud
- [ ] Verify SSL certificate (green lock icon)
- [ ] Test login/signup

## Troubleshooting

### If containers won't start:
```bash
docker compose logs app
docker compose logs postgres
```

### If domain not accessible:
```bash
# Check DNS
ping gms.digitalrain.cloud

# Check Traefik
docker logs traefik | tail -50

# Verify proxy network
docker network ls | grep proxy
docker network inspect proxy
```

### If database connection fails:
```bash
# Check PostgreSQL
docker compose exec postgres psql -U postgres -d gilnokie

# Verify environment variables
docker compose exec app env | grep DATABASE_URL
```

## Post-Deployment

- [ ] Create first admin user (via Supabase or signup)
- [ ] Test all main features:
  - [ ] Customer management
  - [ ] Yarn types
  - [ ] Dashboard loads
- [ ] Set up database backups (see DEPLOYMENT.md)
- [ ] Document admin credentials securely

## Quick Commands Reference

```bash
# View logs
docker compose logs -f app

# Restart services
docker compose restart

# Stop services
docker compose down

# Update deployment (after git push)
cd /opt/gilnokie
git pull
docker compose down
docker compose build
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Configuration Summary

| Setting | Value |
|---------|-------|
| Domain | gms.digitalrain.cloud |
| GitHub Repo | github.com/samgangiah/gms |
| Traefik Network | proxy |
| Cert Resolver | myresolver |
| App Port | 3000 |
| Database | PostgreSQL 16 |
| Database Port | 5432 (internal) |

---

**Ready to Deploy!** Follow the steps above in order.

For detailed explanations, see [DEPLOYMENT.md](DEPLOYMENT.md)
