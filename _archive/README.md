# Archive Folder

This folder contains old deployment configurations and documentation from before the project was migrated to Coolify.

## Contents

### old-docker-deployment/
Old manual Docker deployment files:
- `docker-compose.yml` - Original docker-compose configuration
- `docker-compose.hub.yml` - Docker Hub pre-built image deployment
- `docker-compose.simple.yml` - Simplified deployment configuration
- `docker-init/` - Database initialization scripts for Supabase
- `.env.production` - Old production environment variables (not used with Coolify)
- `build-and-push.sh` - Script to build and push images to Docker Hub
- `build-check.sh` - Script to monitor Docker build progress on VPS
- Various deployment guides (DOCKER_HUB_DEPLOY.md, VPS_SSH_SETUP.md, etc.)

### old-docs/
Old project documentation that has been superseded.

## Why These Were Archived

The project originally used manual Docker deployment with:
- Pre-built images pushed to Docker Hub
- Manual SSH deployment to VPS
- docker-compose orchestration
- Cloudflare Tunnel for external access

This approach has been replaced with **Coolify**, which:
- ✅ Automatically builds from GitHub
- ✅ Handles deployments with one click
- ✅ Manages SSL certificates automatically
- ✅ Provides built-in monitoring and logging
- ✅ Simplifies environment variable management

## Current Deployment

For current deployment instructions, see:
- **[COOLIFY_DEPLOYMENT.md](../COOLIFY_DEPLOYMENT.md)** - Coolify deployment guide
- **[gilnokie-app/Dockerfile](../gilnokie-app/Dockerfile)** - Production Dockerfile

## Keeping This Archive

These files are kept for:
1. **Reference** - In case we need to understand past deployment decisions
2. **Migration history** - Documentation of how the project evolved
3. **Backup approach** - If Coolify is unavailable, we can revert to manual deployment

## Safe to Delete?

Yes, if you're confident in your Coolify setup and don't need historical reference. However, it's recommended to keep this archive in git for documentation purposes.
