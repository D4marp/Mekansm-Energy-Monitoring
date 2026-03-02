# Setup Nginx dengan Domain - energyconsumption.mekansm.com

## Architecture

```
User Browser
     ↓
https://energyconsumption.mekansm.com (Port 443 - HTTPS)
     ↓
[nginx Reverse Proxy]
     ├─→ /api/* → Backend Express (Port 5002)
     ├─→ /health → Backend Express (Port 5002)
     └─→ / → Frontend Next.js (Port 3000)
```

---

## Prerequisites

1. Domain: `energyconsumption.mekansm.com` sudah pointing ke IP: `103.27.207.58`
2. Server dengan IP: `103.27.207.58`
3. Backend running di port 5002
4. Frontend running di port 3000
5. Nginx sudah installed

---

## Setup Steps (Root User)

### 1. Copy konfigurasi nginx ke server

Dari local machine:
```bash
scp nginx/mekansm-energy-domain.conf root@103.27.207.58:/tmp/
```

### 2. SSH ke server
```bash
ssh root@103.27.207.58
```

### 3. Setup nginx config
```bash
# Copy config
cp /tmp/mekansm-energy-domain.conf /etc/nginx/sites-available/

# Symlink ke sites-enabled
ln -s /etc/nginx/sites-available/mekansm-energy-domain.conf /etc/nginx/sites-enabled/

# Disable default site
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Restart nginx
systemctl restart nginx
```

### 4. Setup SSL Certificate dengan Let's Encrypt

```bash
# Install certbot (jika belum ada)
apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
certbot certonly --nginx -d energyconsumption.mekansm.com \
  --non-interactive --agree-tos -m admin@example.com

# Verify certificate
certbot certificates
```

### 5. Reload nginx
```bash
nginx -t
systemctl reload nginx
```

### 6. Enable auto-renewal (optional tapi recommended)
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
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
curl -I http://energyconsumption.mekansm.com
# Output: HTTP/1.1 301, Location: https://energyconsumption.mekansm.com
```

### Test HTTPS access
```bash
curl -I https://energyconsumption.mekansm.com
# Output: HTTP/2 200 (jika OK)
```

### Test API
```bash
curl https://energyconsumption.mekansm.com/api/v1/classes
curl https://energyconsumption.mekansm.com/health
```

---

## Running Backend & Frontend

### Option 1: Terminal Terpisah (Development)

**Terminal 1 - Backend:**
```bash
cd ~/Mekansm-Energy-Monitoring/backend
npm install
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd ~/Mekansm-Energy-Monitoring
npm install
npm run build
npm start
```

### Option 2: PM2 (Production - Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd ~/Mekansm-Energy-Monitoring/backend
npm install
pm2 start server.js --name "mekansm-backend" --env production

# Start frontend
cd ~/Mekansm-Energy-Monitoring
npm install
npm run build
pm2 start "npm start" --name "mekansm-frontend" --env production

# Save PM2 config
pm2 save
pm2 startup
pm2 restart all

# Monitor
pm2 status
pm2 logs
```

---

## Access Points

| Service | URL |
|---------|-----|
| **Frontend** | https://energyconsumption.mekansm.com |
| **API Base** | https://energyconsumption.mekansm.com/api/v1 |
| **Health Check** | https://energyconsumption.mekansm.com/health |
| **Classes** | https://energyconsumption.mekansm.com/api/v1/classes |
| **Devices** | https://energyconsumption.mekansm.com/api/v1/devices |
| **Consumption** | https://energyconsumption.mekansm.com/api/v1/consumption |

**Tidak perlu port 3001! ✅**

---

## Logs

### Nginx logs
```bash
tail -f /var/log/nginx/energyconsumption-access.log
tail -f /var/log/nginx/energyconsumption-error.log
```

### PM2 logs
```bash
pm2 logs
```

### System logs
```bash
journalctl -u nginx -f
journalctl -u certbot.timer -f
```

---

## SSL Certificate Renewal

Let's Encrypt certificates valid 90 hari, auto-renewal otomatis dengan systemd timer.

### Manual renewal (jika diperlukan)
```bash
certbot renew --dry-run    # Test
certbot renew              # Actual
```

### Check renewal status
```bash
systemctl list-timers | grep certbot
```

---

## Troubleshooting

### 1. Certificate tidak found
```bash
# Verify path
ls -la /etc/letsencrypt/live/energyconsumption.mekansm.com/

# Generate lagi jika tidak ada
certbot certonly --nginx -d energyconsumption.mekansm.com --non-interactive --agree-tos -m admin@example.com
```

### 2. Nginx syntax error
```bash
nginx -t
# Lihat error detail
```

### 3. Domain DNS tidak resolved
```bash
# Verify DNS pointing ke server
nslookup energyconsumption.mekansm.com
dig energyconsumption.mekansm.com

# Harus return IP: 103.27.207.58
```

### 4. Backend/Frontend tidak accessible
```bash
# Test backend
curl http://103.27.207.58:5002/health

# Test frontend
curl http://103.27.207.58:3000/

# Check processes
pm2 status
netstat -tlnp | grep -E '3000|5002'
```

### 5. Port 80/443 sudah terpakai
```bash
fuser -k 80/tcp 443/tcp
systemctl restart nginx
```

---

## Environment Variables (Updated)

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://energyconsumption.mekansm.com/api/v1
```

**Backend (.env):**
```env
FRONTEND_URL=https://energyconsumption.mekansm.com
API_PREFIX=/api/v1
PORT=5002
```

---

## Performance Tips

### 1. Enable Caching
Edit `/etc/nginx/sites-enabled/mekansm-energy-domain.conf`, tambahkan di section `http {}`:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=CACHE:100m;
```

Kemudian di location blocks:
```nginx
proxy_cache CACHE;
proxy_cache_valid 200 1h;
```

### 2. Monitor Performance
```bash
# Real-time traffic
tail -f /var/log/nginx/energyconsumption-access.log

# Response times
grep -o 'upstream_response_time [^ ]*' /var/log/nginx/energyconsumption-access.log | sort | uniq -c
```

---

## Quick Checklist

- [ ] Domain `energyconsumption.mekansm.com` pointing ke IP `103.27.207.58`
- [ ] Nginx config copied & symlinked
- [ ] Nginx config test passed
- [ ] SSL certificate generated
- [ ] Nginx reloaded
- [ ] Port 80 & 443 listening
- [ ] DNS resolving correctly
- [ ] Backend running on port 5002
- [ ] Frontend running on port 3000
- [ ] HTTP → HTTPS redirect working
- [ ] API accessible via domain
- [ ] SSL auto-renewal configured
- [ ] Application accessible without port number ✅

---

## Done! 🎉

Aplikasi sekarang bisa diakses di: **https://energyconsumption.mekansm.com**

Tidak perlu port 3001 lagi! 🚀
