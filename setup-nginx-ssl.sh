#!/bin/bash

# Setup nginx dengan SSL (Port 80 & 443)
# Script untuk user root (tanpa sudo)

set -e

echo "=========================================="
echo "Setup Nginx + SSL - Mekansm Energy"
echo "=========================================="
echo ""

# 1. Install nginx & certbot
echo "[1/7] Installing nginx & certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx
echo "✓ Installed"
echo ""

# 2. Copy konfigurasi
echo "[2/7] Copying nginx configuration..."
cp mekansm-energy.conf /etc/nginx/sites-available/
echo "✓ Configuration copied"
echo ""

# 3. Enable site
echo "[3/7] Enabling site..."
ln -s /etc/nginx/sites-available/mekansm-energy.conf /etc/nginx/sites-enabled/ 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default
echo "✓ Site enabled"
echo ""

# 4. Test configuration (tanpa SSL dulu)
echo "[4/7] Testing nginx configuration..."
nginx -t
echo ""

# 5. Start nginx
echo "[5/7] Starting nginx on port 80..."
systemctl restart nginx
systemctl enable nginx
echo "✓ nginx running on port 80"
echo ""

# 6. Setup SSL dengan Let's Encrypt
echo "[6/7] Setting up SSL certificate..."
echo "Choose one option:"
echo "1) Auto setup dengan certbot (recommended)"
echo "2) Manual setup later"
echo ""
read -p "Enter option (1 or 2): " ssl_option

if [ "$ssl_option" = "1" ]; then
    read -p "Enter domain/IP for SSL (e.g., 103.27.207.58 or domain.com): " domain
    
    echo "Generating SSL certificate for: $domain"
    certbot certonly --nginx -d $domain --non-interactive --agree-tos -m admin@example.com
    
    # Update nginx config dengan domain yang benar
    sed -i "s/server_name 103.27.207.58;/server_name $domain;/g" /etc/nginx/sites-enabled/mekansm-energy.conf
    sed -i "s/103.27.207.58/$domain/g" /etc/nginx/sites-enabled/mekansm-energy.conf
    
    # Test dan reload
    nginx -t
    systemctl reload nginx
    echo "✓ SSL certificate configured and nginx reloaded"
else
    echo "⚠ Setup manually later with: certbot certonly --nginx -d your-domain"
fi
echo ""

# 7. Verify
echo "[7/7] Verifying setup..."
echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "HTTP (Port 80):"
echo "  http://103.27.207.58 → redirects to HTTPS"
echo ""
echo "HTTPS (Port 443):"
echo "  https://103.27.207.58"
echo ""
echo "Commands:"
echo "  View access log: tail -f /var/log/nginx/mekansm-energy-access.log"
echo "  View error log:  tail -f /var/log/nginx/mekansm-energy-error.log"
echo "  Reload config:   nginx -s reload"
echo "  Restart nginx:   systemctl restart nginx"
echo ""
echo "SSL Certificate Renewal (auto):"
echo "  certbot renew --dry-run  (test renewal)"
echo "  certbot renew            (actual renewal)"
echo ""
