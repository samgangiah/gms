# Cloudflare Tunnel Setup for Gilnokie GMS

This guide explains how to configure Cloudflare Tunnel to route traffic to your application.

## Services and Ports

Your docker-compose setup exposes these services:

- **Main App**: `localhost:3000` → Route to `gms.digitalrain.cloud`
- **Supabase Auth**: `localhost:9999` → Route to `gms.digitalrain.cloud/auth`
- **Supabase Studio** (optional): `localhost:3001` → Route to `studio.gms.digitalrain.cloud`

## Cloudflare Tunnel Configuration

In your Cloudflare Zero Trust dashboard, configure the tunnel with these ingress rules:

### Option 1: Via Cloudflare Dashboard

1. Go to Cloudflare Zero Trust → Access → Tunnels
2. Edit your tunnel
3. Add the following Public Hostname routes:

**Route 1: Main App**
- **Subdomain**: `gms`
- **Domain**: `digitalrain.cloud`
- **Type**: HTTP
- **URL**: `localhost:3000`

**Route 2: Auth Service** (with path routing)
- **Subdomain**: `gms`
- **Domain**: `digitalrain.cloud`
- **Path**: `/auth`
- **Type**: HTTP
- **URL**: `localhost:9999`

**Route 3: Supabase Studio (Optional)**
- **Subdomain**: `studio.gms`
- **Domain**: `digitalrain.cloud`
- **Type**: HTTP
- **URL**: `localhost:3001`

### Option 2: Via config.yaml

If you prefer managing via config file, create a `tunnel-config.yaml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /path/to/credentials.json

ingress:
  # Auth service - matches /auth/* paths
  - hostname: gms.digitalrain.cloud
    path: ^/auth
    service: http://localhost:9999

  # Main application - all other paths
  - hostname: gms.digitalrain.cloud
    service: http://localhost:3000

  # Supabase Studio (optional)
  - hostname: studio.gms.digitalrain.cloud
    service: http://localhost:3001

  # Catch-all rule (required)
  - service: http_status:404
```

Then run:
```bash
cloudflared tunnel --config tunnel-config.yaml run
```

## Important Notes

### Path Routing for Auth

Cloudflare Tunnel needs to route requests to `gms.digitalrain.cloud/auth/*` to the auth service on port 9999. Make sure the auth route is configured **before** the main app route in your ingress rules.

### Testing

After configuration, test each endpoint:

```bash
# Test main app
curl https://gms.digitalrain.cloud

# Test auth service
curl https://gms.digitalrain.cloud/auth/v1/health

# Test studio (if configured)
curl https://studio.gms.digitalrain.cloud
```

## Running the Tunnel

### As a Docker Container (Recommended)

```bash
docker run -d \
  --name cloudflare-tunnel \
  --restart unless-stopped \
  --network host \
  cloudflare/cloudflared:latest tunnel \
  --no-autoupdate run \
  --token eyJhIjoiNDZjNjBjNWIzMDk4YWViYWJkNDdlOTZkYmY4MDkwNzgiLCJ0IjoiYWU2YjQ1YTMtNTY2OS00ZDhlLTk4ODEtMDIyOWQ4Yjc2MmQzIiwicyI6Ik16UmtZbVl3T1dFdFpEQm1OeTAwWXpGakxXRmhaVFV0WWpBMk5EWmhPRE5oWmpJeCJ9
```

**Note**: Using `--network host` allows the tunnel to access `localhost:3000` and `localhost:9999` directly.

### As a Systemd Service (Alternative)

Create `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate run --token eyJhIjoiNDZjNjBjNWIzMDk4YWViYWJkNDdlOTZkYmY4MDkwNzgiLCJ0IjoiYWU2YjQ1YTMtNTY2OS00ZDhlLTk4ODEtMDIyOWQ4Yjc2MmQzIiwicyI6Ik16UmtZbVl3T1dFdFpEQm1OeTAwWXpGakxXRmhaVFV0WWpBMk5EWmhPRE5oWmpJeCJ9
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## Troubleshooting

### Auth Service Not Working

If auth requests fail:

1. Check that port 9999 is exposed:
   ```bash
   docker ps | grep gms-auth
   ```

2. Test auth service directly:
   ```bash
   curl http://localhost:9999/health
   ```

3. Check Cloudflare Tunnel logs:
   ```bash
   docker logs cloudflare-tunnel
   # or
   sudo journalctl -u cloudflared -f
   ```

### Path Routing Issues

If `/auth` paths aren't routing correctly, ensure:
- The auth route is listed **before** the main app route in tunnel config
- The path pattern matches correctly (use `^/auth` for regex)
- The auth service is actually running on port 9999

## Deployment Workflow

Complete deployment workflow:

```bash
# 1. Pull latest changes
cd /path/to/Gilnokie
git pull

# 2. Pull latest Docker image
docker compose -f docker-compose.hub.yml pull app

# 3. Restart services
docker compose -f docker-compose.hub.yml up -d

# 4. Verify tunnel is running
docker ps | grep cloudflare-tunnel
# or
sudo systemctl status cloudflared

# 5. Test endpoints
curl https://gms.digitalrain.cloud
curl https://gms.digitalrain.cloud/auth/v1/health
```
