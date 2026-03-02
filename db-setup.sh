#!/bin/bash

# Database & Performance Tuning Script
# Run this to optimize MySQL and setup initial data

set -e

echo "=========================================="
echo "Database & Performance Setup"
echo "=========================================="
echo ""

# Database credentials
DB_USER="root"
DB_PASS="mekansm_energy_secure_pwd_2024"
DB_NAME="mekansm_energy"

# Step 1: Create database
echo "[1/4] Setting up database..."
mysql -u $DB_USER -p$DB_PASS << EOF
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS $DB_NAME;
USE $DB_NAME;

-- Optimize database settings
SET GLOBAL innodb_buffer_pool_size = 1GB;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
SET GLOBAL query_cache_size = 64M;
SET GLOBAL query_cache_type = 1;

-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

SHOW VARIABLES LIKE 'innodb%';
SHOW VARIABLES LIKE 'query_cache%';
EOF

echo "✓ Database configured"
echo ""

# Step 2: Initialize schema
echo "[2/4] Initializing schema..."
if [ -f "backend/database/schema.sql" ]; then
    mysql -u $DB_USER -p$DB_PASS $DB_NAME < backend/database/schema.sql
    echo "✓ Schema initialized"
else
    echo "⚠ Schema file not found, skipping"
fi
echo ""

# Step 3: Performance tuning
echo "[3/4] Applying performance tuning..."
mysql -u $DB_USER -p$DB_PASS << EOF
USE $DB_NAME;

-- Add indexes for faster queries
CREATE INDEX idx_device_class ON device(class_id);
CREATE INDEX idx_consumption_device ON consumption(device_id);
CREATE INDEX idx_consumption_date ON consumption(created_at);
CREATE INDEX idx_alert_device ON alert(device_id);
CREATE INDEX idx_alert_date ON alert(created_at);

-- Enable query cache for frequent queries
ANALYZE TABLE device;
ANALYZE TABLE consumption;
ANALYZE TABLE alert;
ANALYZE TABLE class;
ANALYZE TABLE settings;

EOF

echo "✓ Performance tuning applied"
echo ""

# Step 4: Create backup user (optional)
echo "[4/4] Creating backup user..."
mysql -u $DB_USER -p$DB_PASS << EOF
-- Create backup user (optional)
CREATE USER IF NOT EXISTS 'backup'@'localhost' IDENTIFIED BY 'backup_secure_pwd_2024';
GRANT SELECT, LOCK TABLES ON $DB_NAME.* TO 'backup'@'localhost';
FLUSH PRIVILEGES;

-- Show users
SELECT user, host FROM mysql.user WHERE db='$DB_NAME' OR user='backup';
EOF

echo "✓ Backup user created"
echo ""

echo "=========================================="
echo "✓ Database Setup Complete!"
echo "=========================================="
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Backup user: backup"
echo ""
echo "Backup command:"
echo "mysqldump -u backup -p'backup_secure_pwd_2024' $DB_NAME > backup_\$(date +\%Y\%m\%d).sql"
echo ""
