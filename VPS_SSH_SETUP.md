# VPS SSH Setup for GitHub Access

## Problem
Your VPS needs SSH access to clone from GitHub.

## Solution: Add VPS SSH Key to GitHub

### Step 1: Generate SSH Key on VPS

SSH into your VPS and run:

```bash
# Check if SSH key already exists
ls -la ~/.ssh/id_*.pub

# If no key exists, generate one:
ssh-keygen -t ed25519 -C "vps-gms-deployment"

# Press Enter for all prompts (use default location, no passphrase)
```

### Step 2: Display the Public Key

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519`).

### Step 3: Add Key to GitHub

1. Go to: https://github.com/settings/ssh/new
2. **Title:** `VPS - GMS Deployment` (or any name)
3. **Key:** Paste the public key from Step 2
4. Click **"Add SSH key"**

### Step 4: Test Connection

Back on your VPS:

```bash
ssh -T git@github.com
```

You should see:
```
Hi samgangiah! You've successfully authenticated, but GitHub does not provide shell access.
```

### Step 5: Clone Repository

Now you can clone:

```bash
cd ~/vps/projects
git clone git@github.com:samgangiah/gms.git gms
cd gms
```

---

## Alternative: Use HTTPS Instead of SSH

If you don't want to set up SSH keys, you can use HTTPS:

```bash
cd ~/vps/projects
git clone https://github.com/samgangiah/gms.git gms
cd gms
```

**Note:** With HTTPS, you might need a Personal Access Token for private repos.

---

## Quick Reference

### Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

### View Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```

### Test GitHub Connection
```bash
ssh -T git@github.com
```

### Add GitHub to Known Hosts
```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

---

**After adding the SSH key, proceed with the deployment from [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)**
