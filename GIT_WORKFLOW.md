# Git Workflow - Multiple Remotes (Bitbucket + GitHub)

This document explains the Git setup for the Gilnokie project with two remote repositories.

## Repository Setup

### Remote Repositories

1. **`origin`** (Bitbucket) - Main development repository
   - URL: `git@bitbucket.org:fls_dev/manufacturing.git`
   - Purpose: Primary development, team collaboration

2. **`deploy`** (GitHub) - Deployment repository
   - URL: `git@github.com:samgangiah/gms.git`
   - Purpose: VPS deployment via Git pull

### View Current Remotes

```bash
git remote -v
```

Output:
```
deploy	git@github.com:samgangiah/gms.git (fetch)
deploy	git@github.com:samgangiah/gms.git (push)
origin	git@bitbucket.org:fls_dev/manufacturing.git (fetch)
origin	git@bitbucket.org:fls_dev/manufacturing.git (push)
```

## Setting Up GitHub Authentication

Before you can push to GitHub, you need to:

### Option 1: Add SSH Key to GitHub (Recommended)

1. **Check for existing SSH key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # or
   cat ~/.ssh/id_rsa.pub
   ```

2. **If no key exists, create one:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

3. **Copy the public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy  # macOS
   # or manually copy the output
   ```

4. **Add to GitHub:**
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

5. **Test connection:**
   ```bash
   ssh -T git@github.com
   ```

### Option 2: Create GitHub Repository

If the repository doesn't exist on GitHub:

1. Go to https://github.com/new
2. Create a repository named: `gms` (Gilnokie Manufacturing System)
3. **DO NOT** initialize with README, .gitignore, or license
4. Leave it completely empty

## Common Workflows

### 1. Regular Development (Push to Both Remotes)

When you make changes and want to push to both Bitbucket and GitHub:

```bash
# Make your changes
git add .
git commit -m "Your commit message"

# Push to Bitbucket (origin)
git push origin main

# Push to GitHub (deploy)
git push deploy main
```

### 2. Push to Bitbucket Only

For work-in-progress or team-only changes:

```bash
git add .
git commit -m "WIP: Feature in progress"
git push origin main
```

### 3. Push to GitHub Only (For Deployment)

When you want to deploy changes:

```bash
git push deploy main
```

### 4. Push to Both with One Command

Create an alias to push to both remotes:

```bash
# Add to ~/.gitconfig or run:
git config alias.pushall '!git push origin main && git push deploy main'

# Now you can use:
git pushall
```

### 5. Sync from Bitbucket to GitHub

If your teammates push to Bitbucket and you need to update GitHub:

```bash
# Pull from Bitbucket
git pull origin main

# Push to GitHub
git push deploy main
```

## Deployment Workflow

### Initial Deployment to VPS

1. **Push code to GitHub:**
   ```bash
   git push deploy main
   ```

2. **SSH to your VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

3. **Clone from GitHub on VPS:**
   ```bash
   git clone git@github.com:samgangiah/gms.git /opt/gilnokie
   cd /opt/gilnokie
   ```

4. **Deploy with Docker:**
   ```bash
   cp .env.production.example .env
   nano .env  # Configure your environment
   docker compose build
   docker compose up -d
   ```

### Updating Deployment

When you push new changes:

1. **On your local machine:**
   ```bash
   git push deploy main
   ```

2. **On your VPS:**
   ```bash
   cd /opt/gilnokie
   git pull origin main  # Pull from GitHub
   docker compose down
   docker compose build
   docker compose up -d
   docker compose exec app npx prisma migrate deploy
   ```

## Switching Between Remotes

### Temporarily Change Default Remote

If you want to use GitHub as your default temporarily:

```bash
# Set deploy as default
git branch --set-upstream-to=deploy/main main

# Later, switch back to Bitbucket
git branch --set-upstream-to=origin/main main
```

### Check Current Upstream

```bash
git branch -vv
```

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Solution:** You need to add your SSH key to GitHub (see "Setting Up GitHub Authentication" above)

### Issue: "Repository not found"

**Solutions:**
1. Create the repository on GitHub: https://github.com/new
2. Verify the remote URL is correct:
   ```bash
   git remote -v
   ```

### Issue: "fatal: refusing to merge unrelated histories"

If GitHub repo was initialized with README:

```bash
git pull deploy main --allow-unrelated-histories
```

### Issue: Diverged branches

If Bitbucket and GitHub have different commits:

```bash
# Force push to GitHub (careful!)
git push deploy main --force

# Or pull and merge
git pull deploy main
git push deploy main
```

## Important Notes

1. **Never commit sensitive files:**
   - `.env` files are gitignored
   - `.env.production` contains secrets - keep it local only
   - Use `.env.production.example` as template

2. **Keep both remotes in sync:**
   - Regularly push to both remotes
   - Use `git pushall` alias for convenience

3. **VPS pulls from GitHub:**
   - Your VPS will only pull from the `deploy` (GitHub) remote
   - Make sure to push to `deploy` when you want to deploy

4. **Bitbucket is primary:**
   - Use `origin` (Bitbucket) for team collaboration
   - Use `deploy` (GitHub) for deployment only

## Quick Reference

```bash
# Check remotes
git remote -v

# Push to Bitbucket
git push origin main

# Push to GitHub
git push deploy main

# Push to both
git push origin main && git push deploy main

# Pull from Bitbucket
git pull origin main

# Pull from GitHub
git pull deploy main

# Add new remote
git remote add <name> <url>

# Remove remote
git remote remove <name>

# Rename remote
git remote rename <old-name> <new-name>
```

---

**Last Updated:** November 27, 2024
