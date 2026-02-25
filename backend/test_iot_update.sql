-- Simulate IoT Gateway updating device readings
UPDATE devices 
SET 
    current_power = 2.8,
    current_temperature = 22.5,
    last_heartbeat = NOW(),
    iot_status = 'active'
WHERE device_eui = 'AC-KELAS-A-001';

-- Update multiple devices
UPDATE devices 
SET 
    current_power = 0.45,
    last_heartbeat = NOW(),
    iot_status = 'active'
WHERE device_eui = 'LAMP-KELAS-A-001';

-- Insert consumption data for AC
INSERT INTO device_consumption (
    device_id, 
    consumption, 
    consumption_date, 
    hour_start, 
    hour_end, 
    temperature, 
    humidity
)
SELECT 
    1,
    2.8,
    '2026-02-24',
    '07:00:00',
    '08:00:00',
    22.5,
    65
FROM dual
ON DUPLICATE KEY UPDATE 
    consumption = 2.8;

-- Insert consumption data for Lamp
INSERT INTO device_consumption (
    device_id, 
    consumption, 
    consumption_date, 
    hour_start, 
    hour_end
)
SELECT 
    2,
    0.45,
    '2026-02-24',
    '07:00:00',
    '08:00:00'
FROM dual
ON DUPLICATE KEY UPDATE 
    consumption = 0.45;
