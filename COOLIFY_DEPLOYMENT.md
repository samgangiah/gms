# Gilnokie GMS - Coolify Deployment Guide

This guide covers deploying the Gilnokie Manufacturing System to your VPS using Coolify.

## Prerequisites

- Coolify installed on your VPS
- Coolify connected to your GitHub account
- Supabase instance running (either self-hosted or cloud)

## Project Structure

This is a monorepo with the following structure:
```
Gilnokie/
├── gilnokie-app/        # Next.js application (deploy this)
│   ├── Dockerfile       # Production Dockerfile
│   ├── .dockerignore
│   ├── prisma/          # Database schema
│   └── ...
├── _archive/            # Old deployment files (not needed for Coolify)
└── docs/                # Documentation
```

## Coolify Setup

### 1. Create New Resource in Coolify

1. Log into your Coolify dashboard
2. Click "New Resource" → "Public Repository"
3. Select your GitHub repository: `your-github-username/Gilnokie`
4. Choose "Docker Compose" or "Dockerfile" as deployment type

### 2. Configure Build Settings

- **Build Pack**: Dockerfile
- **Dockerfile Location**: `gilnokie-app/Dockerfile`
- **Docker Context**: `gilnokie-app`
- **Port**: `3000`
- **Health Check Path**: `/api/health` (optional)

### 3. Environment Variables

Add these environment variables in Coolify's Environment Variables section:

#### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_HOST]:5432/postgres?schema=public
DIRECT_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_HOST]:5432/postgres?schema=public

# Supabase Public Variables (these are safe to expose in browser)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Supabase Service Role (server-side only, keep secret)
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

#### Optional Build Args (for build-time injection)

If you want to inject Supabase URL at build time:
```bash
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

### 4. Database Setup

Make sure your Supabase instance has:

1. **Prisma migrations applied**:
   ```bash
   # Run migrations (do this locally or in Coolify console)
   npx prisma migrate deploy
   ```

2. **Required permissions** for the database user
3. **Proper connection string** with URL-encoded password if it contains special characters

### 5. Deploy

1. Click "Deploy" in Coolify
2. Monitor the build logs
3. Once deployed, your app will be available at the assigned domain

## Important Notes

### Password Special Characters

If your database password contains special characters like `@`, `#`, `$`, etc., you must URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`

Example:
```bash
# Original password: M@deincha1
# Encoded password: M%40deincha1
DATABASE_URL=postgresql://postgres:M%40deincha1@db:5432/postgres
```

### Standalone Build

The Dockerfile uses Next.js standalone output mode, which:
- Creates a minimal production image (~130MB vs ~1GB+)
- Includes only necessary dependencies
- Runs faster and uses less memory

### Build vs Runtime Variables

- **`NEXT_PUBLIC_*` variables**: Injected at BUILD time and exposed to the browser
- **Other variables**: Injected at RUNTIME and only available server-side

### Database Migrations

Coolify doesn't automatically run database migrations. You have two options:

**Option 1: Run migrations before deployment**
```bash
# Locally with proper DATABASE_URL
npx prisma migrate deploy
```

**Option 2: Add migration to Dockerfile**
```dockerfile
# In runner stage, before CMD
RUN npx prisma migrate deploy
```

## Troubleshooting

### Build Fails with Prisma Errors

If the build fails during `prisma generate`:
- Ensure `DATABASE_URL` is set (even a placeholder will work for generation)
- Check that your `prisma/schema.prisma` file is valid

### App Can't Connect to Database

- Verify `DATABASE_URL` is correctly set in Coolify environment variables
- Check that special characters in password are URL-encoded
- Ensure Supabase allows connections from your VPS IP

### "Module not found" Errors

- Clear Coolify build cache and rebuild
- Verify all dependencies are listed in `package.json`

### PWA Service Worker Issues

The app uses `@ducanh2912/next-pwa`. If you see service worker errors in the browser console:
- These are non-blocking and don't affect core functionality
- The PWA will work offline once the service worker installs successfully

## Updating the App

To deploy updates:

1. Push changes to your GitHub repository
2. Coolify will automatically detect changes (if auto-deploy is enabled)
3. Or manually click "Deploy" in Coolify dashboard

## Rolling Back

Coolify keeps deployment history. To rollback:

1. Go to your resource in Coolify
2. Navigate to "Deployments" tab
3. Click "Rollback" on a previous successful deployment

## Custom Domain

To use a custom domain:

1. In Coolify, go to your resource
2. Navigate to "Domains" section
3. Add your custom domain
4. Update your DNS records to point to your VPS IP
5. Coolify will automatically provision SSL certificates

## Monitoring

- **Logs**: Available in Coolify dashboard under your resource
- **Metrics**: CPU, Memory, and Network usage visible in Coolify
- **Health Checks**: Configure in Coolify to monitor app availability

## Archive Folder

The `_archive` folder contains old Docker deployment configurations from before Coolify. These are kept for reference but are not used in Coolify deployments:

- Old docker-compose files
- VPS manual deployment guides
- Old .env.production files
- Cloudflare Tunnel setup (if not using)

You can safely ignore this folder for Coolify deployments.

## Support

For issues specific to:
- **Coolify**: Check [Coolify documentation](https://coolify.io/docs)
- **Next.js**: Check [Next.js documentation](https://nextjs.org/docs)
- **Supabase**: Check [Supabase documentation](https://supabase.com/docs)
