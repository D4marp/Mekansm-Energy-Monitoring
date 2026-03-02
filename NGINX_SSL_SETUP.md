# Nginx Setup dengan SSL/TLS (Port 80 & 443)

## Architecture Flow

```
User Browser
    ↓
[Port 80 - HTTP]  → Redirect 301 ke HTTPS
    ↓
[Port 443 - TLS/SSL]  → nginx Reverse Proxy
    ├─→ /api/* → Backend Express (Port 5002)
    ├─→ /health → Backend Express (Port 5002)
    └─→ / → Frontend Next.js (Port 3000)
```

---

## Setup Steps (Root User)

### 1. Copy file konfigurasi ke server
```bash
# Dari local machine
scp nginx/mekansm-energy.conf root@103.27.207.58:/tmp/
```

### 2. SSH ke server
```bash
ssh root@103.27.207.58
```

### 3. Install Dependencies
```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

### 4. Setup nginx
```bash
cp /tmp/mekansm-energy.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/mekansm-energy.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 5. Setup SSL Certificate

**Pilih salah satu:**

#### Option A: Untuk IP Address
```bash
certbot certonly --standalone -d 103.27.207.58 \
  --non-interactive --agree-tos -m admin@example.com
```

#### Option B: Untuk Domain Name (Recommended)
```bash
certbot certonly --nginx -d yourdomain.com \
  --non-interactive --agree-tos -m admin@example.com
```

### 6. Update nginx config dengan path SSL yang benar

Edit `/etc/nginx/sites-available/mekansm-energy.conf` dan pastikan:

```nginx
ssl_certificate /etc/letsencrypt/live/103.27.207.58/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/103.27.207.58/privkey.pem;
```

### 7. Test & Reload
```bash
nginx -t
systemctl reload nginx
```

---

## Verification

### Check ports
```bash
netstat -tlnp | grep nginx
# Output: 
#   LISTEN 0.0.0.0:80
#   LISTEN 0.0.0.0:443
```

### Test HTTP → HTTPS redirect
```bash
curl -I http://103.27.207.58
# Output: HTTP/1.1 301
# Location: https://103.27.207.58
```

### Test HTTPS access
```bash
curl -I https://103.27.207.58
# Output: HTTP/2 200 (jika semua OK)
```

### View SSL certificate
```bash
certbot certificates
```

### Check certificate details
```bash
openssl x509 -in /etc/letsencrypt/live/103.27.207.58/fullchain.pem -text -noout
```

---

## SSL Certificate Renewal

Let's Encrypt certificates berlaku 90 hari. Certbot otomatis handle renewal.

### Check renewal status
```bash
systemctl list-timers | grep certbot
```

### Manual test renewal (dry-run)
```bash
certbot renew --dry-run
```

### Manual renewal
```bash
certbot renew
```

---

## Access URLs

| Service | URL |
|---------|-----|
| Frontend | https://103.27.207.58 |
| API | https://103.27.207.58/api/v1/* |
| Health Check | https://103.27.207.58/health |
| Classes | https://103.27.207.58/api/v1/classes |
| Devices | https://103.27.207.58/api/v1/devices |
| Consumption | https://103.27.207.58/api/v1/consumption |

---

## Logs

### Access Log
```bash
tail -f /var/log/nginx/mekansm-energy-access.log
```

### Error Log
```bash
tail -f /var/log/nginx/mekansm-energy-error.log
```

### Certbot Log
```bash
tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Firewall Rules

```bash
# Allow HTTP & HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Verify
ufw status
```

---

## Troubleshooting

### 1. Port 80 atau 443 sudah terpakai
```bash
fuser -k 80/tcp
fuser -k 443/tcp
systemctl restart nginx
```

### 2. SSL certificate tidak found
```bash
# Verify path
ls -la /etc/letsencrypt/live/103.27.207.58/

# Update path di nginx config
nano /etc/nginx/sites-available/mekansm-energy.conf
```

### 3. Nginx syntax error
```bash
nginx -t
# Lihat detailed error
```

### 4. Backend/Frontend tidak accessible
```bash
# Test backend
curl http://103.27.207.58:5002/health

# Test frontend
curl http://103.27.207.58:3000/
```

---

## Performance Optimization

Edit `/etc/nginx/nginx.conf` di section `http {}`:

```nginx
# Connection pooling
upstream backend_upstream {
    server 103.27.207.58:5002;
    keepalive 32;
}

# HTTP/2 Push
http2_push_preload on;

# Compression
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;

# Cache
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=CACHE:10m;
```

---

## Running Backend & Frontend

### Terminal 1 - Backend (Port 5002)
```bash
cd /path/to/mekansm_energy/backend
npm install
node server.js
```

### Terminal 2 - Frontend (Port 3000)
```bash
cd /path/to/mekansm_energy
npm install
npm run build
npm start
```

### OR using PM2 (production recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd /path/to/backend
pm2 start server.js --name "mekansm-backend"

# Start frontend
cd /path/to/frontend
pm2 start "npm start" --name "mekansm-frontend"

# Save & enable startup
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs
```

---

## Quick Checklist

- [ ] Dependencies installed (nginx, certbot)
- [ ] nginx config copied & symlinked
- [ ] nginx test passed without errors
- [ ] SSL certificate generated & configured
- [ ] nginx reloaded
- [ ] Port 80 & 443 listening
- [ ] HTTP → HTTPS redirect working
- [ ] Backend running on port 5002
- [ ] Frontend running on port 3000
- [ ] API accessible via https://103.27.207.58/api/v1/*
- [ ] Certificate auto-renewal configured
