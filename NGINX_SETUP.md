# Setup nginx untuk Mekansm Energy Monitoring

## Prerequisites
Sebelum memulai, pastikan Anda memiliki:
- Server dengan IP: 103.27.207.58
- Backend Express.js berjalan di port 5002
- Frontend Next.js berjalan di port 3000
- nginx sudah terinstall di server

---

## 1. Install nginx (jika belum ada)

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install nginx
```

### macOS:
```bash
brew install nginx
```

### CentOS/RHEL:
```bash
sudo yum install nginx
```

---

## 2. Copy Konfigurasi File

### Untuk Linux/Ubuntu:
```bash
# Copy file konfigurasi
sudo cp mekansm-energy.conf /etc/nginx/sites-available/

# Create symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/mekansm-energy.conf /etc/nginx/sites-enabled/

# Disable default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### Untuk macOS:
```bash
# Copy ke nginx config directory
cp mekansm-energy.conf /usr/local/etc/nginx/servers/
```

---

## 3. Update Environment Variables

Update `.env.local` dengan URL yang benar:

```env
NEXT_PUBLIC_API_URL=http://103.27.207.58:3001/api/v1
```

Update `backend/.env` jika ada:

```env
FRONTEND_URL=http://103.27.207.58:3001
API_PREFIX=/api/v1
PORT=5002
```

---

## 4. Start Backend & Frontend

### Terminal 1 - Start Backend (port 5002):
```bash
cd backend
npm install
node server.js
```

### Terminal 2 - Start Frontend (port 3000):
```bash
npm install
npm run build
npm start
```

Atau untuk development:
```bash
npm run dev
```

---

## 5. Test nginx Configuration

Sebelum start nginx, test konfigurasi:

```bash
# Linux/Ubuntu/macOS
nginx -t
# atau
sudo nginx -t
```

Output yang diharapkan:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## 6. Start/Restart nginx

### Untuk Linux/Ubuntu:
```bash
# Start nginx
sudo systemctl start nginx

# Restart nginx (jika ada konfigurasi baru)
sudo systemctl restart nginx

# Enable auto-start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Untuk macOS:
```bash
# Start nginx
nginx

# Reload configuration
nginx -s reload

# Stop nginx
nginx -s stop
```

---

## 7. Verify Setup

Buka browser dan test:

```
# Frontend
http://103.27.207.58:3001/

# API Health Check
http://103.27.207.58:3001/health

# API Endpoints
http://103.27.207.58:3001/api/v1/classes
http://103.27.207.58:3001/api/v1/devices
http://103.27.207.58:3001/api/v1/consumption
```

---

## 8. Troubleshooting

### nginx tidak start:
```bash
# Check error log
sudo tail -f /var/log/nginx/error.log

# Verify port 3001 tidak terpakai
sudo lsof -i :3001
```

### Upstream server not reachable:
```bash
# Test backend connection
curl http://103.27.207.58:5002/health

# Test frontend connection  
curl http://103.27.207.58:3000/
```

### CORS Error:
Pastikan backend `.env` memiliki:
```env
FRONTEND_URL=http://103.27.207.58:3001
```

### Permission Denied:
```bash
# Restart dengan sudo
sudo systemctl restart nginx

# Atau untuk macOS
sudo nginx -s reload
```

---

## 9. Advanced Configuration (Optional)

### Menambah SSL/HTTPS

Uncomment bagian HTTP to HTTPS redirect di `mekansm-energy.conf` dan gunakan Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d 103.27.207.58

# Update nginx.conf untuk SSL
```

---

## 10. Monitoring

### Check nginx process:
```bash
ps aux | grep nginx
```

### View access logs:
```bash
sudo tail -f /var/log/nginx/mekansm-energy-access.log
```

### View error logs:
```bash
sudo tail -f /var/log/nginx/mekansm-energy-error.log
```

---

## 11. Performance Tuning

Untuk production, edit `/etc/nginx/nginx.conf` di section `http {}`:

```nginx
worker_processes auto;
worker_connections 1024;

# Keep-alive timeout
keepalive_timeout 65;

# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# Cache
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=CACHE:10m;
```

Kemudian di `mekansm-energy.conf`, tambahkan di location blocks:

```nginx
proxy_cache CACHE;
proxy_cache_valid 200 1h;
proxy_cache_use_stale error timeout invalid_header updating;
```

---

## 12. Flow Diagram

```
User (Browser)
    ↓ http://103.27.207.58:3001
[nginx - Port 3001]
    ↓
├─→ /api/* → Backend Express (Port 5002)
├─→ /health → Backend Express (Port 5002)
└─→ / → Frontend Next.js (Port 3000)
```

---

## Selesai! ✅

Sekarang aplikasi Anda dapat diakses melalui `http://103.27.207.58:3001/`
