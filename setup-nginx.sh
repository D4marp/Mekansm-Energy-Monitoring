#!/bin/bash

# Setup nginx untuk Mekansm Energy Monitoring
# Script ini dibuat untuk user root (tanpa sudo)
# Run: bash setup-nginx.sh

set -e

echo "=========================================="
echo "Setup Nginx - Mekansm Energy Monitoring"
echo "=========================================="
echo ""

# 1. Install nginx
echo "[1/6] Installing nginx..."
apt update
apt install -y nginx
echo "✓ nginx installed"
echo ""

# 2. Copy konfigurasi
echo "[2/6] Copying nginx configuration..."
if [ ! -f "mekansm-energy.conf" ]; then
    echo "ERROR: mekansm-energy.conf not found in current directory"
    exit 1
fi

cp mekansm-energy.conf /etc/nginx/sites-available/
echo "✓ Configuration copied to /etc/nginx/sites-available/"
echo ""

# 3. Create symlink
echo "[3/6] Enabling site..."
if [ -L "/etc/nginx/sites-enabled/mekansm-energy.conf" ]; then
    echo "✓ Symlink already exists"
else
    ln -s /etc/nginx/sites-available/mekansm-energy.conf /etc/nginx/sites-enabled/
    echo "✓ Symlink created"
fi
echo ""

# 4. Disable default site
echo "[4/6] Disabling default site..."
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    echo "✓ Default site disabled"
else
    echo "✓ Default site already disabled"
fi
echo ""

# 5. Test configuration
echo "[5/6] Testing nginx configuration..."
nginx -t
echo ""

# 6. Start/Restart nginx
echo "[6/6] Starting nginx..."
systemctl restart nginx
systemctl enable nginx
systemctl status nginx
echo ""

echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Application is running on:"
echo "  http://103.27.207.58:3001/"
echo ""
echo "API Health Check:"
echo "  http://103.27.207.58:3001/health"
echo ""
echo "View logs:"
echo "  tail -f /var/log/nginx/mekansm-energy-access.log"
echo "  tail -f /var/log/nginx/mekansm-energy-error.log"
echo ""
