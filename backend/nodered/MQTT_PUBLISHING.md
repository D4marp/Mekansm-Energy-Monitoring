# MQTT Data Publishing Guide

Panduan lengkap untuk mengirim data ke Mekansm Energy Dashboard melalui MQTT.

## Device Setup

Sebelum mengirim data, pastikan device sudah terdaftar di backend dengan device_eui yang sama.

### Register Device via Backend API

```bash
curl -X POST http://localhost:5000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "device_name": "AC Room 1",
    "device_type": "AC",
    "device_eui": "device-001",
    "location": "Room 1A",
    "power_rating": 5.0
  }'
```

## Publishing Methods

### Method 1: MQTT CLI (mosquitto-pub)

**Single Reading:**
```bash
mosquitto_pub -h mqtt.broker.com -p 1883 \
  -t "mekansm/device-001/power" \
  -m "2.5"
```

**Multiple Readings Sequentially:**
```bash
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/power" -m "2.5"
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/temperature" -m "25.3"
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/humidity" -m "65.2"
```

**With Retain Flag (retain last message):**
```bash
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/power" -r -m "2.5"
```

### Method 2: Python Script

**Simple Publisher:**
```python
import paho.mqtt.client as mqtt
import time

broker = "mqtt.broker.com"
port = 1883
client_id = "python-publisher"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✓ Connected to MQTT broker")
    else:
        print(f"✗ Connection failed: {rc}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print(f"Unexpected disconnection: {rc}")

client = mqtt.Client(client_id, clean_session=True)
client.on_connect = on_connect
client.on_disconnect = on_disconnect

try:
    client.connect(broker, port, keepalive=60)
    client.loop_start()
    
    # Publish power consumption
    client.publish("mekansm/device-001/power", 2.5, qos=1)
    client.publish("mekansm/device-001/temperature", 25.3, qos=1)
    client.publish("mekansm/device-001/humidity", 65.2, qos=1)
    
    print("✓ Messages published")
    
    time.sleep(2)
    client.loop_stop()
    client.disconnect()
    
except Exception as e:
    print(f"✗ Error: {e}")
```

**Realistic Simulation (reading every 5 seconds):**
```python
import paho.mqtt.client as mqtt
import time
import json
from datetime import datetime

broker = "mqtt.broker.com"
port = 1883

# Simulate multiple devices
devices = [
    {"eui": "device-001", "name": "AC Room 1", "power_base": 2.5},
    {"eui": "device-002", "name": "AC Room 2", "power_base": 2.8},
    {"eui": "device-003", "name": "Lamp Hallway", "power_base": 0.5}
]

def on_connect(client, userdata, flags, rc):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Connected to broker")

client = mqtt.Client("python-simulator")
client.on_connect = on_connect

try:
    client.connect(broker, port, 60)
    client.loop_start()
    
    counter = 0
    while True:
        for device in devices:
            eui = device["eui"]
            # Simulate realistic power fluctuation
            power = device["power_base"] + (counter % 10) * 0.1
            temp = 20 + (counter % 15)  # Temperature variation
            humidity = 50 + (counter % 30)
            
            client.publish(f"mekansm/{eui}/power", f"{power:.1f}", qos=1)
            client.publish(f"mekansm/{eui}/temperature", f"{temp:.1f}", qos=1)
            client.publish(f"mekansm/{eui}/humidity", f"{humidity:.1f}", qos=1)
        
        counter += 1
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Cycle {counter} - Sent data for {len(devices)} devices")
        time.sleep(5)
        
except KeyboardInterrupt:
    print("\nStopping...")
    client.loop_stop()
    client.disconnect()
except Exception as e:
    print(f"Error: {e}")
```

### Method 3: Node.js Script

```javascript
const mqtt = require('mqtt');

const brokerUrl = 'mqtt://mqtt.broker.com:1883';
const client = mqtt.connect(brokerUrl);

const devices = [
  { eui: 'device-001', power_base: 2.5 },
  { eui: 'device-002', power_base: 2.8 },
  { eui: 'device-003', power_base: 0.5 }
];

client.on('connect', () => {
  console.log('✓ Connected to MQTT broker');
  
  // Publish every 5 seconds
  setInterval(() => {
    devices.forEach(device => {
      const power = (device.power_base + Math.random() * 0.5).toFixed(1);
      const temp = (20 + Math.random() * 10).toFixed(1);
      const humidity = Math.floor(50 + Math.random() * 30);
      
      client.publish(`mekansm/${device.eui}/power`, power);
      client.publish(`mekansm/${device.eui}/temperature`, temp);
      client.publish(`mekansm/${device.eui}/humidity`, humidity);
    });
    
    console.log(`[${new Date().toLocaleTimeString()}] Data published`);
  }, 5000);
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err);
});
```

### Method 4: Arduino/IoT Device

**Arduino Example (using PubSubClient library):**
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// MQTT
const char* mqtt_broker = "mqtt.broker.com";
const int mqtt_port = 1883;
const char* mqtt_user = "username";  // if required
const char* mqtt_password = "password";  // if required
const char* device_eui = "device-001";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ WiFi connected");
  
  // Connect to MQTT
  client.setServer(mqtt_broker, mqtt_port);
  connectMQTT();
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(device_eui)) {
      Serial.println("✓ Connected");
    } else {
      Serial.print("✗ Failed with code ");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  // Read sensors
  float power = readPowerSensor();      // e.g., 2.5 kW
  float temperature = readTemp();        // e.g., 25.3°C
  float humidity = readHumidity();       // e.g., 65.2%
  
  // Publish data
  char topic[100];
  char payload[50];
  
  sprintf(topic, "mekansm/%s/power", device_eui);
  sprintf(payload, "%.1f", power);
  client.publish(topic, payload);
  
  sprintf(topic, "mekansm/%s/temperature", device_eui);
  sprintf(payload, "%.1f", temperature);
  client.publish(topic, payload);
  
  sprintf(topic, "mekansm/%s/humidity", device_eui);
  sprintf(payload, "%.1f", humidity);
  client.publish(topic, payload);
  
  Serial.println("✓ Data published");
  delay(60000);  // Send data every 60 seconds
}

float readPowerSensor() {
  // Implement your sensor reading logic
  return analogRead(A0) / 100.0;
}

float readTemp() {
  // Implement your temperature reading logic
  return 25.3;
}

float readHumidity() {
  // Implement your humidity reading logic
  return 65.2;
}
```

## Message Format

### Simple Format (Scalar Value)
```
Topic:  mekansm/device-001/power
Value:  2.5
QoS:    1 (recommended)
```

### Payload Formats Accepted

**1. Simple Number:**
```
2.5
```

**2. JSON Object:**
```json
{
  "power": 2.5,
  "temperature": 25.3,
  "humidity": 65.2,
  "timestamp": "2024-02-26T10:30:00Z"
}
```
⚠️ Note: If using JSON, publish ke masing-masing topic, bukan JSON di satu topic.

## Data Types

| Data Type | Topic Suffix | Unit | Range | Example |
|-----------|-------------|------|-------|---------|
| Power | `/power`, `/consumption`, `/kwh` | kW | 0.0 - 999.9 | 2.5 |
| Temperature | `/temperature`, `/temp` | °C | -50 to 100 | 25.3 |
| Humidity | `/humidity`, `/humid` | % | 0 - 100 | 65.2 |
| Voltage | `/voltage` | V | 0 - 240 | 220.5 |
| Current | `/current` | A | 0 - 100 | 11.4 |

## Best Practices

### 1. QoS Levels
- **QoS 0**: Fire and forget (fastest, less reliable)
- **QoS 1**: At least once (default, recommended) ✓
- **QoS 2**: Exactly once (slowest, most reliable)

```bash
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/power" -m "2.5" -q 1
```

### 2. Retain Messages
Keep last message alive for new subscribers:
```bash
mosquitto_pub -h mqtt.broker.com -t "mekansm/device-001/power" -r -m "2.5"
```

### 3. Topic Naming Convention
- Use lowercase
- Use kebab-case for device names: `device-001`
- Standard suffixes: `/power`, `/temperature`, `/humidity`

### 4. Frequency
- Minimum: once per hour
- Recommended: every 5-10 minutes
- Maximum: every few seconds (for real-time monitoring)

### 5. Data Validation
- Validate sensor readings before publishing
- Skip publishing if value is obviously wrong
- Add timestamps for data provenance

```python
if 0 <= power <= 100:  # Valid range
    client.publish("mekansm/device-001/power", power)
else:
    print(f"Invalid reading: {power}")
```

## Monitoring & Testing

### Subscribe to Monitor Data

```bash
# Monitor all devices
mosquitto_sub -h mqtt.broker.com -t "mekansm/+"

# Monitor specific device
mosquitto_sub -h mqtt.broker.com -t "mekansm/device-001/#"

# Monitor with timestamp
mosquitto_sub -h mqtt.broker.com -t "mekansm/#" -v
```

### Check if Data is Saved

```bash
# Check via API
curl http://localhost:5000/api/v1/devices/eui/device-001

# Check database
mysql -u root -p mekansm_energy \
  -e "SELECT * FROM device_consumption WHERE device_id=1 ORDER BY created_at DESC LIMIT 5"
```

## Troubleshooting

### Issue: Connection Refused
- Check MQTT broker is running: `sudo systemctl status mosquitto`
- Check firewall allows port 1883
- Verify broker IP/hostname

### Issue: Messages Not Appearing in Backend
- Check device_eui is registered in database
- Check topic format: `mekansm/[eui]/[type]`
- Check Node-RED flow is deployed and running
- Check backend API is responding: `curl http://localhost:5000/api/v1/health`

### Issue: Data Loss
- Use QoS 1 or 2
- Enable persistent storage on MQTT broker
- Check database logs for errors

## See Also

- [Node-RED Integration](./README.md)
- [MQTT Specification](https://mqtt.org/mqtt-specification)
- [Mosquitto Documentation](https://mosquitto.org/)
- [PubSubClient Arduino Library](https://pubsubclient.knolleary.net/)
