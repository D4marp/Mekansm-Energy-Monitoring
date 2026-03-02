# Complete Production Deployment Guide

## Quick Start (Copy-Paste for Root User)

Jika ingin langsung run semua, jalankan ini di server:

```bash
#!/bin/bash
cd ~/Mekansm-Energy-Monitoring

# 1. Verify DNS
echo "Verifying DNS..."
nslookup energyconsumption.mekansm.com

# 2. Setup Nginx & SSL
echo "Setting up Nginx & SSL..."
ln -sf /etc/nginx/sites-available/mekansm-energy-domain.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d energyconsumption.mekansm.com --non-interactive --agree-tos -m admin@example.com
nginx -t && systemctl reload nginx

# 3. Setup Database
echo "Setting up Database..."
bash db-setup.sh

# 4. Setup Backend
echo "Setting up Backend..."
cd backend
npm install --production
npm install -g pm2
pm2 start server.js --name "mekansm-backend"

# 5. Setup Frontend
echo "Setting up Frontend..."
cd ../
npm install --production
npm run build
pm2 start "npm start" --name "mekansm-frontend"

# 6. Save PM2
pm2 save
pm2 startup
pm2 restart all

# 7. Final Verification
echo "Verifying services..."
pm2 status
netstat -tlnp | grep -E 'nginx|3000|5002'
curl -I https://energyconsumption.mekansm.com
echo "Done!"
```

---

## Step-by-Step Detailed Guide

### Prerequisites
- Server IP: 103.27.207.58
- Domain: energyconsumption.mekansm.com
- DNS A Record pointing to 103.27.207.58 ✅
- Root/sudo access
- Git installed

### Part 1: Download & Setup Application

```bash
# SSH to server
ssh root@103.27.207.58

# Clone or pull latest code
cd ~
git clone https://github.com/D4marp/Mekansm-Energy-Monitoring.git
# OR if already exists:
cd Mekansm-Energy-Monitoring
git pull origin main

cd ~/Mekansm-Energy-Monitoring
```

### Part 2: Nginx Configuration

```bash
# Copy nginx config
cp nginx/mekansm-energy-domain.conf /etc/nginx/sites-available/

# Enable site
ln -s /etc/nginx/sites-available/mekansm-energy-domain.conf /etc/nginx/sites-enabled/ 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

# Verify
systemctl status nginx
netstat -tlnp | grep nginx
```

### Part 3: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
apt update
apt install -y certbot python3-certbot-nginx

# Generate certificate
certbot certonly --nginx -d energyconsumption.mekansm.com \
  --non-interactive --agree-tos -m admin@example.com

# Verify certificate
certbot certificates
ls -la /etc/letsencrypt/live/energyconsumption.mekansm.com/

# Test and reload
nginx -t
systemctl reload nginx

# Enable auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Part 4: Database Setup

```bash
# Run database setup script
bash db-setup.sh

# Verify database
mysql -u root -p < /dev/null

# Create backup
mysqldump -u root mekansm_energy > backup_initial.sql
```

### Part 5: Backend Setup

```bash
cd ~/Mekansm-Energy-Monitoring/backend

# Install dependencies
npm install --production

# Install PM2 globally
npm install -g pm2

# Verify .env is correct
cat .env

# Start with PM2
pm2 start server.js --name "mekansm-backend"

# Verify
pm2 status
curl http://103.27.207.58:5002/health

# View logs
pm2 logs mekansm-backend
```

### Part 6: Frontend Setup

```bash
cd ~/Mekansm-Energy-Monitoring

# Install dependencies
npm install --production

# Verify .env is correct
cat .env.local

# Build for production
npm run build

# Start with PM2
pm2 start "npm start" --name "mekansm-frontend"

# Verify
pm2 status
curl http://103.27.207.58:3000/

# View logs
pm2 logs mekansm-frontend
```

### Part 7: PM2 Configuration

```bash
# Save PM2 config
pm2 save

# Setup auto-startup on reboot
pm2 startup

# Restart all services
pm2 restart all

# Monitor
pm2 monit

# List all processes
pm2 status
pm2 list
```

### Part 8: Firewall & Security

```bash
# Allow required ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Verify rules
ufw status

# Disable unnecessary services
systemctl disable apache2 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
```

### Part 9: Final Verification

```bash
# 1. Check DNS
echo "=== DNS Check ==="
nslookup energyconsumption.mekansm.com

# 2. Check Nginx
echo "=== Nginx Check ==="
systemctl status nginx
netstat -tlnp | grep nginx

# 3. Check Services
echo "=== Services Check ==="
pm2 status
netstat -tlnp | grep -E '3000|5002'

# 4. Check SSL Certificate
echo "=== SSL Check ==="
certbot certificates
openssl x509 -in /etc/letsencrypt/live/energyconsumption.mekansm.com/fullchain.pem -noout -dates

# 5. Test HTTPS
echo "=== HTTPS Test ==="
curl -I https://energyconsumption.mekansm.com
curl -I https://energyconsumption.mekansm.com/health
curl https://energyconsumption.mekansm.com/api/v1/classes

# 6. Test API
echo "=== API Test ==="
curl -s https://energyconsumption.mekansm.com/api/v1/classes | head -20

# 7. View Logs
echo "=== Recent Logs ==="
tail -20 /var/log/nginx/energyconsumption-access.log
```

---

## Monitoring & Maintenance

### Daily Tasks
```bash
# Check application logs
pm2 logs

# Monitor resources
pm2 monit

# View nginx errors
tail -f /var/log/nginx/energyconsumption-error.log
```

### Weekly Tasks
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Verify SSL certificate
certbot certificates

# Check for updates
apt update
apt list --upgradable
```

### Monthly Tasks
```bash
# Database backup
mysqldump -u backup -p mekansm_energy > backup_$(date +%Y%m%d).sql

# Update dependencies
cd ~/Mekansm-Energy-Monitoring/backend
npm update --production
cd ../
npm update --production

# Update system
apt upgrade -y

# Restart services
pm2 restart all
```

### Quarterly Tasks
```bash
# Test SSL renewal
certbot renew --dry-run

# Actual SSL renewal (usually automatic)
certbot renew

# Full system update
apt update && apt upgrade -y
apt autoremove -y
```

---

## Common Commands

### PM2 Management
```bash
# Start service
pm2 start server.js --name "app-name"

# Restart service
pm2 restart app-name

# Stop service
pm2 stop app-name

# Delete service
pm2 delete app-name

# View logs
pm2 logs app-name

# Real-time monitoring
pm2 monit

# Save configuration
pm2 save

# Resurrect saved configuration
pm2 resurrect

# List all processes
pm2 list
```

### Nginx Management
```bash
# Test configuration
nginx -t

# Reload (no downtime)
systemctl reload nginx

# Restart
systemctl restart nginx

# Stop
systemctl stop nginx

# Start
systemctl start nginx

# Status
systemctl status nginx

# View logs
tail -f /var/log/nginx/energyconsumption-access.log
tail -f /var/log/nginx/energyconsumption-error.log
```

### Database Management
```bash
# Connect to database
mysql -u root -p

# Backup
mysqldump -u root -p mekansm_energy > backup.sql

# Restore
mysql -u root -p mekansm_energy < backup.sql

# Check database size
mysql -u root -p -e "SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS size_mb FROM information_schema.tables GROUP BY table_schema;"
```

### System Management
```bash
# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep "node\|npm\|nginx"

# Check listening ports
netstat -tlnp
lsof -i

# System logs
journalctl -xe
```

---

## Troubleshooting

### Application Not Responding
```bash
# Check if services are running
pm2 status

# Restart services
pm2 restart mekansm-backend
pm2 restart mekansm-frontend

# Check logs
pm2 logs

# Check if ports are listening
netstat -tlnp | grep -E '3000|5002'

# Test directly
curl http://103.27.207.58:3000/
curl http://103.27.207.58:5002/health
```

### SSL Certificate Issues
```bash
# Check certificate validity
certbot certificates

# Check certificate details
openssl x509 -in /etc/letsencrypt/live/energyconsumption.mekansm.com/fullchain.pem -text -noout

# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

### Database Connection Issues
```bash
# Test connection
mysql -u root -h localhost -e "SELECT 1;"

# Check MySQL status
systemctl status mysql

# Verify credentials in .env
cat backend/.env | grep DB_

# Check MySQL is listening
netstat -tlnp | grep mysql
```

### High CPU/Memory Usage
```bash
# Check what's using resources
top
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10

# Check nginx worker processes
ps aux | grep nginx

# PM2 monitoring
pm2 monit
```

---

## Security Hardening

### Enable Firewall
```bash
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### SSH Security
```bash
# Create new SSH key
ssh-keygen -t ed25519 -C "admin@energyconsumption.mekansm.com"

# Disable password authentication
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd
```

### Database Security
```bash
# Create separate database user (non-root)
mysql -u root << EOF
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON mekansm_energy.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Application Secrets
```bash
# Rotate JWT secret regularly
# Generate new secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in backend/.env
# Restart backend
pm2 restart mekansm-backend
```

---

## Backup & Recovery

### Create Full Backup
```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u backup -p mekansm_energy > "$BACKUP_DIR/db_$DATE.sql"

# Application backup
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" ~/Mekansm-Energy-Monitoring

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

### Restore from Backup
```bash
# Restore database
mysql -u root -p < /backup/db_backup.sql

# Restore application
tar -xzf /backup/app_backup.tar.gz
```

---

## Performance Tuning

### Nginx Caching
Already configured in nginx config:
- Static assets: 30 days
- API responses: 10 minutes
- HTML pages: 5 minutes

### Database Optimization
Already configured in db-setup.sh:
- InnoDB buffer pool: 1GB
- Query cache: 64MB
- Slow query log: enabled
- Indexes: optimized

### Node.js Optimization
```bash
# Increase file descriptor limit
ulimit -n 65536

# Run with clustering (optional, for production)
npm install -g cluster-mode
pm2 start server.js -i max --name "mekansm-backend"
```

---

## Contact & Support

For issues or questions:
- Check logs: `pm2 logs` or `tail -f /var/log/nginx/*`
- Verify service status: `pm2 status`
- Check DNS: `nslookup energyconsumption.mekansm.com`
- Visit: https://energyconsumption.mekansm.com

---

**Setup completed! Application is production-ready.** 🚀
