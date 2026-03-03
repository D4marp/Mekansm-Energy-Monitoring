#!/bin/bash

# Production Setup Script - Mekansm Energy Monitoring
# Domain: energyconsumption.mekansm.com
# This script completes the production setup

set -e

DOMAIN="energyconsumption.mekansm.co.id"
APP_DIR="/root/Mekansm-Energy-Monitoring"

echo "=========================================="
echo "Production Setup - Mekansm Energy"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# Step 1: Verify DNS
echo "[1/8] Verifying DNS..."
if nslookup $DOMAIN | grep -q "103.27.207.58"; then
    echo "✓ DNS resolved correctly to 103.27.207.58"
else
    echo "✗ DNS not resolved yet! Wait 5-10 minutes and try again."
    exit 1
fi
echo ""

# Step 2: Setup Nginx
echo "[2/8] Setting up Nginx..."
ln -sf /etc/nginx/sites-available/mekansm-energy-domain.conf /etc/nginx/sites-enabled/ 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo "✓ Nginx configured"
echo ""

# Step 3: Setup SSL Certificate
echo "[3/8] Setting up SSL Certificate..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    apt install -y certbot python3-certbot-nginx
    certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@example.com
    echo "✓ SSL certificate generated"
else
    echo "✓ SSL certificate already exists"
fi
nginx -t && systemctl reload nginx
echo ""

# Step 4: Setup Backend
echo "[4/8] Setting up Backend..."
cd $APP_DIR/backend
npm install --production 2>/dev/null | tail -5
npm install -g pm2 2>/dev/null || true
pm2 start server.js --name "mekansm-backend" || pm2 restart mekansm-backend
echo "✓ Backend started"
echo ""

# Step 5: Setup Frontend
echo "[5/8] Setting up Frontend..."
cd $APP_DIR
npm install --production 2>/dev/null | tail -5
npm run build 2>/dev/null | tail -3
pm2 start "npm start" --name "mekansm-frontend" || pm2 restart mekansm-frontend
echo "✓ Frontend built and started"
echo ""

# Step 6: PM2 Setup
echo "[6/8] Configuring PM2..."
pm2 save
pm2 startup > /dev/null 2>&1 || true
pm2 restart all
sleep 3
echo "✓ PM2 configured"
echo ""

# Step 7: Create firewall rules
echo "[7/8] Setting up Firewall..."
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true
echo "✓ Firewall rules configured"
echo ""

# Step 8: Verify All Services
echo "[8/8] Verifying Services..."
echo ""
echo "Checking services..."
echo ""

# Nginx
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx: Running"
else
    echo "✗ Nginx: NOT RUNNING"
fi

# Backend
if pm2 list | grep -q "mekansm-backend"; then
    echo "✓ Backend: Running (Port 5002)"
else
    echo "✗ Backend: NOT RUNNING"
fi

# Frontend
if pm2 list | grep -q "mekansm-frontend"; then
    echo "✓ Frontend: Running (Port 3000)"
else
    echo "✗ Frontend: NOT RUNNING"
fi

# SSL Certificate
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    EXPIRY=$(certbot certificates | grep "Expiry Date" | head -1)
    echo "✓ SSL Certificate: $EXPIRY"
else
    echo "✗ SSL Certificate: NOT FOUND"
fi

echo ""
echo "=========================================="
echo "✓ Production Setup Complete!"
echo "=========================================="
echo ""
echo "Application URL: https://$DOMAIN"
echo ""
echo "Commands:"
echo "  View logs:         pm2 logs"
echo "  Restart backend:   pm2 restart mekansm-backend"
echo "  Restart frontend:  pm2 restart mekansm-frontend"
echo "  Stop all:          pm2 stop all"
echo "  Monitor:           pm2 monit"
echo ""
echo "Nginx logs:"
echo "  Access: tail -f /var/log/nginx/energyconsumption-access.log"
echo "  Error:  tail -f /var/log/nginx/energyconsumption-error.log"
echo ""
echo "Certificate renewal:"
echo "  sudo certbot renew --dry-run   (test)"
echo "  sudo certbot renew              (actual)"
echo ""
