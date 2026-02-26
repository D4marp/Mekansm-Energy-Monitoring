# Node-RED Integration Guide - Mekansm Energy Dashboard

## Overview
Node-RED digunakan untuk menerima data real-time dari IoT devices melalui MQTT dan mengirimkannya ke backend API untuk disimpan di database.

## Architecture Flow

```
IoT Devices (MQTT)
    ↓
MQTT Broker
    ↓
Node-RED Flow
    ├─ Subscribe MQTT → mekansm/+/+
    ├─ Parse Device & Data
    ├─ Buffer Readings (5 min)
    ├─ Get Device Info (API call)
    ├─ Build Payload
    └─ Save to Backend API (/consumption/realtime)
    ↓
Backend Database
    ├─ device_consumption (hourly)
    ├─ devices (current_power)
    └─ alerts (if threshold exceeded)
```

## Setup Instructions

### 1. Install Node-RED
```bash
npm install -g node-red
npm install -g node-red-dashboard
npm install -g node-red-contrib-mqtt-broker

# Or with PM2
npm install -g pm2
pm2 install node-red

# Start Node-RED
node-red
```

Access Node-RED at: `http://localhost:1880`

### 2. Import Flow

1. Copy content dari `mekansm-realtime-flow.json`
2. Di Node-RED, click menu hamburger → Import
3. Paste JSON content
4. Click Import

Atau drag & drop file ke Node-RED editor.

### 3. Configure MQTT Broker

**Option A: Use External MQTT Broker**

Edit "Mekansm MQTT Broker" node:
- Broker: `mqtt.example.com` (diganti dengan IP/hostname broker Anda)
- Port: `1883` (atau 8883 untuk SSL)
- Client ID: `nodered-mekansm-001`

**Option B: Run MQTT Broker Locally**

```bash
# Install Mosquitto MQTT Broker
sudo apt-get install mosquitto mosquitto-clients

# Start broker
mosquitto -c /etc/mosquitto/mosquitto.conf

# Check if running
netstat -an | grep 1883
```

### 4. Configure Backend API URL

Edit "Get Device Info" node:
- URL: `http://localhost:5000/api/v1/devices/eui/{{{deviceData.device_eui}}}`
  - Ganti `localhost:5000` dengan IP dan port backend Anda
  - Jika production, gunakan HTTPS: `https://103.27.207.58:5000/api/v1/devices/eui/{{{deviceData.device_eui}}}`

Edit "Save to Backend API" node:
- URL: `http://localhost:5000/api/v1/consumption/realtime`
  - Ganti dengan IP dan port backend Anda

### 5. Deploy Flow

Click tombol **Deploy** di Node-RED untuk aktivasi flow.

## MQTT Topic Structure

Format: `mekansm/[DEVICE_EUI]/[DATA_TYPE]`

### Examples:

```bash
# Power consumption (kW)
mekansm/device-001/power          → 2.5
mekansm/device-001/consumption    → 2.5
mekansm/device-001/kwh            → 2.5

# Temperature (°C)
mekansm/device-001/temperature    → 25.3
mekansm/device-001/temp           → 25.3

# Humidity (%)
mekansm/device-001/humidity       → 65.2
mekansm/device-001/humid          → 65.2

# Multiple readings
mekansm/device-001/power          → 2.5
mekansm/device-001/temperature    → 25.3
mekansm/device-001/humidity       → 65.2
```

## Testing with MQTT Client

### Using CLI:

```bash
# Subscribe (monitor incoming data)
mosquitto_sub -h mqtt.broker.com -t "mekansm/+/+"

# Publish test data
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/power" -m "2.5"
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/temperature" -m "25.3"
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/humidity" -m "65.2"
```

### Using Node-RED Dashboard:

Inject test message ke MQTT Subscribe node untuk simulasi.

### Using Python Script:

```python
import paho.mqtt.client as mqtt
import json
import time

CLIENT_ID = "test-publisher"
BROKER = "mqtt.broker.com"
PORT = 1883

client = mqtt.Client(CLIENT_ID)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to broker")
    else:
        print(f"Connection failed with code {rc}")

client.on_connect = on_connect

try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    # Send test data
    for i in range(5):
        client.publish("mekansm/device-001/power", 2.5)
        client.publish("mekansm/device-001/temperature", 25.3)
        client.publish("mekansm/device-001/humidity", 65.2)
        
        print(f"Published message {i+1}")
        time.sleep(5)
    
    client.loop_stop()
    client.disconnect()

except Exception as e:
    print(f"Error: {e}")
```

## Backend API Endpoints

### POST /api/v1/consumption/realtime
Save single real-time consumption record.

**Request:**
```json
{
  "device_eui": "device-001",
  "device_id": 1,
  "device_name": "AC Room 1",
  "device_type": "AC",
  "class_id": 1,
  "consumption": 2.5,
  "temperature": 25.3,
  "humidity": 65.2,
  "timestamp": "2024-02-26T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Real-time consumption data recorded successfully",
  "data": {
    "device_id": 1,
    "device_name": "AC Room 1",
    "device_type": "AC",
    "consumption": 2.5,
    "temperature": 25.3,
    "humidity": 65.2,
    "timestamp": "2024-02-26T10:30:00.000Z",
    "consumption_date": "2024-02-26",
    "hour_start": "10:30:00"
  }
}
```

### POST /api/v1/consumption/realtime/bulk
Save multiple real-time records in one request.

**Request:**
```json
{
  "data": [
    {
      "device_eui": "device-001",
      "consumption": 2.5,
      "temperature": 25.3,
      "timestamp": "2024-02-26T10:30:00Z"
    },
    {
      "device_eui": "device-002",
      "consumption": 1.8,
      "temperature": 22.1,
      "timestamp": "2024-02-26T10:30:00Z"
    }
  ]
}
```

### GET /api/v1/devices/eui/:eui
Get device info by EUI.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "class_id": 1,
    "device_eui": "device-001",
    "device_name": "AC Room 1",
    "device_type": "AC",
    "class_name": "Kelas 1A",
    "current_power": 2.5,
    "current_temperature": 25.3,
    "status": "active"
  }
}
```

## Monitoring & Debugging

### View Node-RED Debug Output

1. Open Node-RED editor
2. Click "Debug" tab on the right
3. Look for success/error messages
4. Check timestamps and data payloads

### View Backend Logs

```bash
# Terminal running backend
npm start

# Or with PM2
pm2 logs backend
```

### Check Database

```bash
# SSH into server, connect to MySQL
mysql -u root -p mekansm_energy

# View latest consumption data
SELECT * FROM device_consumption 
ORDER BY created_at DESC 
LIMIT 10;

# View device status
SELECT id, device_name, device_eui, current_power, last_reading 
FROM devices 
ORDER BY last_reading DESC;
```

## Performance Optimization

### Buffer Readings
By default, readings dari satu device di-buffer untuk 5 menit sebelum dikirim ke database. Edit "Buffer Readings (5min)" function node untuk ubah durasi:

```javascript
context.set(contextKey, storedData, 'default', 300); // 300 = 5 minutes in seconds
```

### Bulk Insert
Untuk volume data besar, gunakan endpoint `/realtime/bulk` untuk insert multiple records sekaligus.

### Database Indexes
Database sudah punya indexes di:
- `device_id`
- `consumption_date`
- `consumption_date, hour_start`

## Troubleshooting

### Issue: Not receiving MQTT messages

**Solution:**
```bash
# Check MQTT broker connectivity
mosquitto_pub -h mqtt.broker.com -t "test" -m "hello"
mosquitto_sub -h mqtt.broker.com -t "test"

# Check Node-RED MQTT connection status
# (check node status indicators in editor)
```

### Issue: API call fails (404)

**Solution:**
- Pastikan backend service berjalan: `npm start`
- Check URL di Node-RED nodes (GET Device Info & Save to Backend)
- Verify device_eui terdaftar di database

### Issue: Data not saved to database

**Solution:**
```bash
# Check backend logs
npm start

# Check database connection
mysql -u root -p -e "SELECT 1"

# Verify table exists
mysql -u root -p mekansm_energy -e "DESCRIBE device_consumption"
```

### Issue: Duplicate key error

**Solution:**
- Database menggunakan UNIQUE KEY pada (device_id, consumption_date, hour_start)
- Jika data dikirim berkali-kali dalam hour yang sama, akan di-UPDATE bukan INSERT
- Ini adalah behavior yang diinginkan untuk avoid duplicate data

## Advanced Configuration

### SSL/TLS for MQTT

Update "Mekansm MQTT Broker" node:
- Enable TLS: `✓`
- Port: `8883`
- CA Certificate: (paste certificate content if needed)

### Custom Data Parsing

Edit "Parse Device & Data" function untuk custom parsing logic:

```javascript
// Example: parse JSON payload
if (typeof msg.payload === 'string') {
  value = JSON.parse(msg.payload).value;
}

// Example: convert units
value = value * 1.2; // e.g., convert to different unit
```

### Alerts & Notifications

Add switch/trigger nodes setelah "Check consumption?":
- If consumption > threshold → send email alert
- If temperature > max → trigger warning
- Custom business logic

## See Also

- [Node-RED Documentation](https://nodered.org/docs/)
- [MQTT Specification](https://mqtt.org/)
- [Mekansm Energy Dashboard API Docs](../README.md)
