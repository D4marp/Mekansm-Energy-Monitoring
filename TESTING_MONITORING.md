# Testing & Monitoring Guide

## API Testing

### Health Check
```bash
curl -I https://energyconsumption.mekansm.com/health
```

Expected Response:
```
HTTP/2 200
Content-Type: application/json
```

### API Endpoints Testing

```bash
# Get all classes
curl -s https://energyconsumption.mekansm.com/api/v1/classes | jq '.'

# Get all devices
curl -s https://energyconsumption.mekansm.com/api/v1/devices | jq '.'

# Get consumption data
curl -s https://energyconsumption.mekansm.com/api/v1/consumption | jq '.'

# Get alerts
curl -s https://energyconsumption.mekansm.com/api/v1/alerts | jq '.'

# Get settings
curl -s https://energyconsumption.mekansm.com/api/v1/settings | jq '.'
```

### Performance Testing with Apache Bench

```bash
# Install ab
apt install -y apache2-utils

# Test homepage
ab -n 100 -c 10 https://energyconsumption.mekansm.com/

# Test API endpoint
ab -n 100 -c 10 https://energyconsumption.mekansm.com/api/v1/classes

# With custom headers
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  https://energyconsumption.mekansm.com/api/v1/devices
```

### Load Testing with wrk

```bash
# Install wrk
apt install -y wrk

# Basic load test
wrk -t4 -c100 -d30s https://energyconsumption.mekansm.com/

# API load test
wrk -t4 -c100 -d30s https://energyconsumption.mekansm.com/api/v1/classes

# With Lua script
wrk -t4 -c100 -d30s -s script.lua https://energyconsumption.mekansm.com/
```

---

## Application Monitoring

### Real-time Monitoring with PM2

```bash
# Real-time dashboard
pm2 monit

# View specific service logs
pm2 logs mekansm-backend
pm2 logs mekansm-frontend

# Show service details
pm2 show mekansm-backend
pm2 show mekansm-frontend

# List all services
pm2 list
pm2 status
```

### Resource Monitoring

```bash
# Check CPU & Memory
pm2 status

# Top processes
top -b -n 1 | head -20

# Memory usage
free -h

# Disk usage
df -h
du -sh ~/Mekansm-Energy-Monitoring

# Process details
ps aux --sort=-%cpu
ps aux --sort=-%mem
```

### Nginx Monitoring

```bash
# Active connections
netstat -an | grep ESTABLISHED | wc -l

# Request rate per second
tail -1 /var/log/nginx/energyconsumption-access.log | grep -oP '(?<=HTTP/\d\.\d" )\d+'

# Cache hit rate
grep "X-Cache-Status" /var/log/nginx/energyconsumption-access.log | \
  awk '{print $7}' | sort | uniq -c

# Average response time
awk '{print $NF}' /var/log/nginx/energyconsumption-access.log | \
  awk '{sum+=$1; count++} END {print "Avg:", sum/count "ms"}'
```

### Database Monitoring

```bash
# Database size
mysql -u root -e "SELECT table_schema, \
  SUM(data_length + index_length) / 1024 / 1024 AS size_mb \
  FROM information_schema.tables \
  GROUP BY table_schema;"

# Active connections
mysql -u root -e "SHOW PROCESSLIST;"

# Query statistics
mysql -u root -e "SHOW STATUS LIKE 'Threads%';"
mysql -u root -e "SHOW STATUS LIKE 'Questions';"

# Slow queries
mysql -u root -e "SHOW VARIABLES LIKE 'slow_query%';"
tail -f /var/log/mysql/slow.log
```

---

## Log Analysis

### Nginx Error Log Analysis

```bash
# Check for errors
grep "error" /var/log/nginx/energyconsumption-error.log

# Count errors by type
awk '{print $4}' /var/log/nginx/energyconsumption-error.log | sort | uniq -c | sort -rn

# Find errors from specific time
grep "03/Mar/2026:12:" /var/log/nginx/energyconsumption-access.log | tail -50
```

### Nginx Access Log Analysis

```bash
# Top 10 accessed URLs
awk '{print $7}' /var/log/nginx/energyconsumption-access.log | sort | uniq -c | sort -rn | head -10

# Top 10 client IPs
awk '{print $1}' /var/log/nginx/energyconsumption-access.log | sort | uniq -c | sort -rn | head -10

# HTTP status codes
awk '{print $9}' /var/log/nginx/energyconsumption-access.log | sort | uniq -c

# Requests by hour
awk '{print $4}' /var/log/nginx/energyconsumption-access.log | \
  awk -F: '{print $2}' | sort | uniq -c

# Average response time
awk '{print $NF}' /var/log/nginx/energyconsumption-access.log | \
  awk '{sum+=$1; count++} END {print sum/count}'
```

### Application Log Analysis

```bash
# Backend logs
pm2 logs mekansm-backend --lines 100

# Frontend logs
pm2 logs mekansm-frontend --lines 100

# Real-time logs
pm2 logs --raw
```

---

## Alerting Rules

### CPU Usage Alert
```bash
# Alert if CPU > 80%
watch -n 5 'top -b -n 1 | grep %Cpu | awk "{if (\$2 > 80) print \"ALERT: High CPU!\"}"'
```

### Memory Usage Alert
```bash
# Alert if Memory > 85%
watch -n 5 'free | grep Mem | awk "{if ((\$3/\$2)*100 > 85) print \"ALERT: High Memory!\"}"'
```

### Disk Space Alert
```bash
# Alert if disk > 90%
watch -n 5 'df / | tail -1 | awk "{if (\$5 > 90) print \"ALERT: Low Disk Space!\"}"'
```

### Service Down Alert
```bash
# Check if services are running
while true; do
  pm2 status | grep -E "mekansm-(backend|frontend)" | grep -v online && \
    echo "ALERT: Service is down!" || true
  sleep 60
done
```

---

## Benchmarking

### Baseline Performance Test

```bash
#!/bin/bash

echo "=== Performance Baseline Test ==="
echo ""

echo "1. Homepage Load Time"
time curl -s https://energyconsumption.mekansm.com/ > /dev/null

echo ""
echo "2. API Response Time"
time curl -s https://energyconsumption.mekansm.com/api/v1/classes > /dev/null

echo ""
echo "3. Concurrent Requests (10 requests, 5 concurrent)"
ab -n 10 -c 5 https://energyconsumption.mekansm.com/

echo ""
echo "4. Database Query Time (from backend)"
curl -s https://energyconsumption.mekansm.com/api/v1/classes | wc -c

echo ""
echo "=== Test Complete ==="
```

### Load Test Scenarios

**Light Load (normal usage):**
```bash
wrk -t2 -c10 -d10s https://energyconsumption.mekansm.com/
```

**Medium Load:**
```bash
wrk -t4 -c50 -d30s https://energyconsumption.mekansm.com/
```

**Heavy Load (stress test):**
```bash
wrk -t8 -c200 -d60s https://energyconsumption.mekansm.com/
```

---

## SSL Certificate Monitoring

### Check Certificate Validity

```bash
# Days remaining
certbot certificates | grep "Expiry Date"

# Detailed info
openssl x509 -in /etc/letsencrypt/live/energyconsumption.mekansm.com/fullchain.pem \
  -noout -dates -subject

# Certificate chain
openssl s_client -connect energyconsumption.mekansm.com:443 -servername energyconsumption.mekansm.com \
  < /dev/null | openssl x509 -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After"
```

### Renewal Monitoring

```bash
# Check renewal schedule
systemctl list-timers | grep certbot

# View renewal log
tail -f /var/log/letsencrypt/letsencrypt.log

# Test renewal (dry-run)
certbot renew --dry-run

# Debug renewal
certbot renew --verbose --dry-run
```

---

## Health Checks

### Comprehensive System Health Check

```bash
#!/bin/bash

echo "=== System Health Check ==="
echo ""

# 1. DNS
echo "1. DNS Resolution:"
nslookup energyconsumption.mekansm.com | grep "Address:"

# 2. Nginx
echo "2. Nginx Status:"
systemctl status nginx | grep Active

# 3. Backend
echo "3. Backend Status:"
curl -s -I https://energyconsumption.mekansm.com/health | head -1

# 4. Frontend
echo "4. Frontend Status:"
curl -s -I https://energyconsumption.mekansm.com/ | head -1

# 5. Database
echo "5. Database Status:"
mysql -u root -e "SELECT 1" 2>/dev/null && echo "✓ Database OK" || echo "✗ Database Error"

# 6. Disk Space
echo "6. Disk Space:"
df -h / | tail -1

# 7. Memory
echo "7. Memory Usage:"
free -h | grep Mem

# 8. Services
echo "8. PM2 Services:"
pm2 status | grep -E "mekansm|online|stopped"

# 9. SSL Certificate
echo "9. SSL Certificate:"
certbot certificates | grep "Expiry Date"

# 10. Logs
echo "10. Recent Errors:"
tail -5 /var/log/nginx/energyconsumption-error.log
```

---

## Dashboard Setup (Optional)

### Install Grafana & Prometheus

```bash
# Install Prometheus
mkdir -p /opt/prometheus
cd /opt/prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.35.0/prometheus-2.35.0.linux-amd64.tar.gz
tar xzf prometheus-2.35.0.linux-amd64.tar.gz

# Install Grafana
apt install -y grafana-server
systemctl start grafana-server
systemctl enable grafana-server

# Access Grafana
# http://103.27.207.58:3000
# Default: admin/admin
```

---

## Automated Monitoring Script

Create `/usr/local/bin/check-mekansm.sh`:

```bash
#!/bin/bash

# Set alert threshold
CPU_THRESHOLD=80
MEM_THRESHOLD=85
DISK_THRESHOLD=90

# Check CPU
CPU=$(top -b -n 1 | grep "%Cpu" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU > $CPU_THRESHOLD" | bc -l) )); then
    echo "ALERT: High CPU usage: $CPU%"
fi

# Check Memory
MEM=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ "$MEM" -gt "$MEM_THRESHOLD" ]; then
    echo "ALERT: High memory usage: $MEM%"
fi

# Check Disk
DISK=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ "$DISK" -gt "$DISK_THRESHOLD" ]; then
    echo "ALERT: Low disk space: $((100 - DISK))% free"
fi

# Check services
pm2 status | grep "stopped" && echo "ALERT: Some services are stopped!"

# Check SSL certificate (alert if expiring in < 7 days)
EXPIRY=$(certbot certificates 2>/dev/null | grep "Expiry Date" | awk '{print $NF}')
DAYS=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))
if [ "$DAYS" -lt 7 ]; then
    echo "ALERT: SSL certificate expiring in $DAYS days!"
fi
```

Make executable and run via cron:

```bash
chmod +x /usr/local/bin/check-mekansm.sh

# Run every 5 minutes
*/5 * * * * /usr/local/bin/check-mekansm.sh >> /var/log/mekansm-health.log 2>&1
```

---

## Notification Setup (Optional)

### Email Alerts via Postfix

```bash
# Install postfix
apt install -y postfix

# Configure for alerts
echo "Subject: Mekansm Alert" | sendmail admin@example.com
```

### Slack Integration

```bash
# Create webhook at: https://api.slack.com/messaging/webhooks

# Send alert to Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Dashboard Alert: High CPU usage!"}' \
  YOUR_SLACK_WEBHOOK_URL
```

---

**Monitoring setup complete! System is protected and monitored.** 📊🔍
