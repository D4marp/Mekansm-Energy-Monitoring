# Production Setup Checklist - Mekansm Energy Monitoring

## Domain Configuration
- [x] Domain: `energyconsumption.mekansm.com`
- [x] DNS A Record: `103.27.207.58`
- [x] DNS Status: Active ✅

---

## Environment Variables (Updated)

### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mekansm_energy_secure_pwd_2024
DB_NAME=mekansm_energy
DB_PORT=3306

# Server Configuration
PORT=5002
NODE_ENV=production

# JWT Configuration
JWT_SECRET=mekansm_energy_jwt_secret_key_production_2024_secure
JWT_EXPIRE=7d

# API Configuration
FRONTEND_URL=https://energyconsumption.mekansm.com
API_PREFIX=/api/v1

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=https://energyconsumption.mekansm.com
```

### Frontend (.env.local)
```env
# Next.js Configuration
NEXT_PUBLIC_API_URL=https://energyconsumption.mekansm.com/api/v1

# Environment
NODE_ENV=production

# Analytics & Monitoring
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

---

## Nginx Configuration (Updated)

**File:** `/etc/nginx/sites-available/mekansm-energy-domain.conf`

### Features:
- ✅ HTTP → HTTPS redirect (Port 80 → 443)
- ✅ SSL/TLS 1.2 & 1.3
- ✅ Gzip compression (all static assets)
- ✅ Proxy caching (30 days for static, 10 min for API)
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc)
- ✅ Load balancing (least_conn)
- ✅ Connection keepalive
- ✅ Rate limiting ready
- ✅ WebSocket support

---

## Production Deployment Steps

### Step 1: Copy Files to Server
```bash
# From local machine
scp -r /Users/HCMPublic/Kuliah/mekansm_energy/ root@103.27.207.58:~/

# Or use git
git push origin main
# Then on server: git pull origin main
```

### Step 2: Run Production Setup Script
```bash
ssh root@103.27.207.58

cd ~/Mekansm-Energy-Monitoring

# Run setup script
bash production-setup.sh
```

### Step 3: Manual Verification
```bash
# Verify DNS
nslookup energyconsumption.mekansm.com

# Verify Nginx
nginx -t
systemctl status nginx
netstat -tlnp | grep -E 'nginx|3000|5002'

# Verify Processes
pm2 status
pm2 logs

# Test HTTPS
curl -I https://energyconsumption.mekansm.com
curl -I https://energyconsumption.mekansm.com/health
curl https://energyconsumption.mekansm.com/api/v1/classes
```

---

## Security Checklist

- [x] HTTPS enabled (TLS 1.2 & 1.3)
- [x] JWT secret changed (strong password)
- [x] Database password set
- [x] CORS restricted to domain only
- [x] Security headers activated
- [x] CSP enabled
- [x] HSTS enabled (31536000 seconds = 1 year)
- [x] X-Frame-Options: SAMEORIGIN
- [x] X-Content-Type-Options: nosniff
- [x] Firewall rules (80, 443, 22)
- [ ] Database backups scheduled (TODO)
- [ ] Monitoring/alerting setup (TODO)
- [ ] Log rotation configured (TODO)

---

## Performance Optimizations

- ✅ Gzip compression enabled
- ✅ Proxy caching (30 days for static assets)
- ✅ API caching (10 minutes for GET requests)
- ✅ Connection pooling (keepalive 32)
- ✅ HTTP/2 enabled
- ✅ Buffer optimization
- ✅ Load balancing (least_conn)
- ✅ Session reuse
- ✅ Buffer size optimization

---

## Maintenance Tasks

### Daily:
```bash
# Check application logs
pm2 logs

# Monitor resources
pm2 monit
```

### Weekly:
```bash
# Check certificate expiry
certbot certificates

# Review nginx errors
tail -f /var/log/nginx/energyconsumption-error.log
```

### Monthly:
```bash
# Update system
apt update && apt upgrade -y

# Update Node.js dependencies
cd backend && npm update --production
cd ../
npm update --production

# Database backup
mysqldump -u root -p mekansm_energy > backup_$(date +%Y%m%d).sql
```

### Quarterly:
```bash
# SSL certificate renewal (auto but verify)
certbot renew --dry-run
certbot renew
```

---

## Monitoring & Logging

### Nginx Logs
```bash
# Real-time access
tail -f /var/log/nginx/energyconsumption-access.log

# Error logs
tail -f /var/log/nginx/energyconsumption-error.log

# Check cache hit rate
grep "X-Cache-Status" /var/log/nginx/energyconsumption-access.log | grep -c HIT
```

### Application Logs
```bash
# PM2 logs
pm2 logs mekansm-backend
pm2 logs mekansm-frontend

# Monitor resources
pm2 monit

# List processes
pm2 status
```

### System Logs
```bash
# Nginx service logs
journalctl -u nginx -f

# SSL/Certificate logs
journalctl -u certbot.timer -f
tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Troubleshooting

### 502 Bad Gateway
```bash
# Check backend
curl http://103.27.207.58:5002/health

# Check frontend
curl http://103.27.207.58:3000/

# View nginx error
tail -f /var/log/nginx/energyconsumption-error.log
```

### SSL Certificate Issues
```bash
# Check certificate
certbot certificates

# Verify path exists
ls -la /etc/letsencrypt/live/energyconsumption.mekansm.com/

# Test renewal
certbot renew --dry-run
```

### Database Connection Issues
```bash
# Test connection
mysql -h localhost -u root -p mekansm_energy -e "SELECT 1;"

# Check credentials in .env
cat backend/.env | grep DB_
```

### PM2 Not Starting
```bash
# Clear PM2 cache
pm2 kill

# Start services again
cd backend && pm2 start server.js --name "mekansm-backend"
cd ../
npm run build && pm2 start "npm start" --name "mekansm-frontend"

# Verify
pm2 status
```

---

## Backup & Recovery

### Create Backup
```bash
# Database backup
mysqldump -u root -p mekansm_energy > mekansm_energy_backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf mekansm-energy-backup-$(date +%Y%m%d).tar.gz ~/Mekansm-Energy-Monitoring

# Move to safe location
mv mekansm-energy-backup-*.tar.gz /backup/
```

### Restore from Backup
```bash
# Restore database
mysql -u root -p mekansm_energy < backup.sql

# Restore application
tar -xzf mekansm-energy-backup.tar.gz
```

---

## Access Information

| Service | URL |
|---------|-----|
| **Application** | https://energyconsumption.mekansm.com |
| **API** | https://energyconsumption.mekansm.com/api/v1 |
| **Health Check** | https://energyconsumption.mekansm.com/health |
| **Database** | localhost:3306 |
| **Backend** | 103.27.207.58:5002 |
| **Frontend** | 103.27.207.58:3000 |

---

## Support & Contacts

- **Admin Email:** admin@example.com
- **Domain:** energyconsumption.mekansm.com
- **Server IP:** 103.27.207.58
- **Support:** contact@mekansm.com

---

## Version Info

- **Setup Date:** March 3, 2026
- **Node.js:** v18.x (recommended)
- **Nginx:** 1.18.0+
- **MySQL:** 5.7+
- **Next.js:** Latest production
- **Express.js:** Latest

---

## Final Notes

✅ **Production-ready configuration complete!**

- Domain configured with HTTPS
- SSL certificate auto-renewal enabled
- Nginx optimized for performance
- Caching configured aggressively
- Security headers configured
- Database secured
- Application monitoring with PM2

**The application is now accessible at: https://energyconsumption.mekansm.com** 🚀
