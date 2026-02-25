# 📦 Backend Structure Summary

backend/
├── 📁 config/
│   └── database.js                 # MySQL connection pool configuration
│
├── 📁 controllers/                 # Business logic handlers
│   ├── ClassController.js          # CRUD untuk Kelas
│   ├── DeviceController.js         # CRUD untuk Perangkat + Status + Reading
│   ├── ConsumptionController.js    # Konsumsi harian, bulanan, agregat
│   ├── AlertController.js          # CRUD, filter, mark as read
│   └── SettingsController.js       # Sistem & User settings
│
├── 📁 models/                      # Database queries
│   ├── Class.js                    # Query untuk classes table
│   ├── Device.js                   # Query untuk devices table
│   ├── Consumption.js              # Query untuk device_consumption table
│   ├── Alert.js                    # Query untuk alerts table
│   └── Settings.js                 # Query untuk settings & user_settings
│
├── 📁 routes/                      # Express route handlers
│   ├── classRoutes.js              # /api/v1/classes endpoints
│   ├── deviceRoutes.js             # /api/v1/devices endpoints
│   ├── consumptionRoutes.js        # /api/v1/consumption endpoints
│   ├── alertRoutes.js              # /api/v1/alerts endpoints
│   └── settingsRoutes.js           # /api/v1/settings endpoints
│
├── 📁 database/
│   └── schema.sql                  # Database schema & sample data
│
├── 💾 server.js                    # Express app setup & middleware
├── 🔧 package.json                 # Dependencies & scripts
├── .env                            # Configuration variables
├── .env.example                    # Template for .env
├── .gitignore                      # Git ignore patterns
├── .editorconfig                   # Code style settings
├── README.md                        # Detailed documentation
├── API_DOCUMENTATION.md            # API endpoints reference
├── setup.sh                        # Setup script for macOS/Linux
└── setup.bat                       # Setup script for Windows

## ✨ Key Features

### 1. **Classes Management** 📚
- Get all classes
- Get class by ID
- Create, update, delete classes
- Each class can have multiple devices

### 2. **Devices Management** 🔌
- Get all devices
- Filter by class or type
- Create, update, delete devices
- Update device status (active/idle/offline/maintenance)
- Update device readings (power & temperature)
- Track efficiency rating

### 3. **Consumption Tracking** 📊
- Get daily consumption per device
- Get monthly consumption trends
- Bulk import consumption data
- Hourly aggregated data by class
- Total consumption comparison

### 4. **Alert System** 🔔
- Create alerts with type & severity
- Filter alerts by type/severity/status
- Mark individual or all alerts as read
- Track unread alerts count
- Get alert summary statistics

### 5. **Settings Management** ⚙️
- System-wide settings (timezone, language, theme)
- User-specific settings (notifications, thresholds)
- Customizable alert thresholds
- Session & security settings

## 🗄️ Database Tables

1. **classes** - Ruangan/Kelas
   - name, description, location, floor, area, capacity, status

2. **devices** - Perangkat
   - name, type, brand, model, power_rating, efficiency_rating, status
   - current_power, current_temperature, last_reading

3. **device_consumption** - Data Konsumsi Per Jam
   - device_id, consumption, consumption_date, hour_start, hour_end
   - temperature, humidity

4. **alerts** - Pemberitahuan
   - device_id, class_id, type, title, message, severity
   - status, read_status, triggered_at, resolved_at

5. **settings** - Pengaturan Sistem
   - setting_key, setting_value, data_type, editable

6. **user_settings** - Pengaturan User
   - user_id, timezone, language, theme
   - email/sms/push notifications, thresholds

7. **audit_logs** - Audit Trail (untuk tracking perubahan)

## API Endpoints Overview

```
Classes
  GET    /api/v1/classes
  POST   /api/v1/classes
  GET    /api/v1/classes/:id
  PUT    /api/v1/classes/:id
  DELETE /api/v1/classes/:id

Devices
  GET    /api/v1/devices
  GET    /api/v1/devices/class/:classId
  GET    /api/v1/devices/type/:type
  POST   /api/v1/devices
  PUT    /api/v1/devices/:id
  PATCH  /api/v1/devices/:id/status
  PATCH  /api/v1/devices/:id/reading
  DELETE /api/v1/devices/:id

Consumption
  GET    /api/v1/consumption/daily/:deviceId?date=YYYY-MM-DD
  GET    /api/v1/consumption/monthly/:deviceId?year=YYYY&month=MM
  GET    /api/v1/consumption/hourly/class/:classId?date=YYYY-MM-DD
  POST   /api/v1/consumption
  POST   /api/v1/consumption/bulk

Alerts
  GET    /api/v1/alerts
  GET    /api/v1/alerts/:id
  POST   /api/v1/alerts
  PUT    /api/v1/alerts/:id
  PATCH  /api/v1/alerts/:id/read
  DELETE /api/v1/alerts/:id

Settings
  GET    /api/v1/settings
  GET    /api/v1/settings/:key
  POST   /api/v1/settings
  GET    /api/v1/settings/user/:userId
  PUT    /api/v1/settings/user/:userId
```

## 🚀 Quick Start

### 1. Setup Database
```bash
# Create database & import schema
mysql -u root -p smart_energy_dashboard < backend/database/schema.sql
```

### 2. Install & Configure
```bash
cd backend
npm install
# Edit .env dengan database credentials
```

### 3. Run Server
```bash
npm run dev  # Development with auto-reload
npm start    # Production
```

### 4. Connect Frontend
```bash
# Create .env.local in frontend directory
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🔧 Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_energy_dashboard
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:3001
API_PREFIX=/api/v1
```

## 📚 Documentation Files

- **README.md** - Complete setup & API documentation
- **API_DOCUMENTATION.md** - Quick API reference
- **SETUP_GUIDE.md** - Step-by-step setup instructions
- **schema.sql** - Database schema with sample data

## 🎯 Integration with Frontend

The backend is designed to work seamlessly with the Next.js frontend:

1. **Dasbor (Dashboard)** - Uses:
   - GET /classes
   - GET /devices
   - GET /consumption/hourly/class/:classId

2. **Perangkat (Devices)** - Uses:
   - GET /devices
   - GET /devices/class/:classId
   - GET /consumption/daily/:deviceId

3. **Analitik (Analytics)** - Uses:
   - GET /consumption/monthly/:deviceId
   - GET /consumption/class/:classId
   - GET /alerts/summary/stats

4. **Pemberitahuan (Alerts)** - Uses:
   - GET /alerts
   - PATCH /alerts/:id/read
   - POST /alerts

5. **Pengaturan (Settings)** - Uses:
   - GET /settings
   - GET /settings/user/:userId
   - PUT /settings/user/:userId

## ✅ Features Implemented

- ✅ Complete CRUD operations for all entities
- ✅ Relationship management (classes → devices → consumption)
- ✅ Time-based data aggregation (hourly, daily, monthly)
- ✅ Alert system with status tracking
- ✅ Settings management (system & user-level)
- ✅ Error handling & validation
- ✅ CORS enabled for frontend integration
- ✅ Environment-based configuration
- ✅ Proper HTTP status codes
- ✅ Consistent API response format

## 🔒 Security Considerations (To Implement)

- [ ] JWT authentication
- [ ] Input validation & sanitization
- [ ] Rate limiting
- [ ] API key authentication
- [ ] HTTPS in production
- [ ] SQL injection prevention (using parameterized queries ✅)
- [ ] CORS security headers
- [ ] Request logging & monitoring

## 📈 Future Enhancements

- [ ] WebSocket for real-time data updates
- [ ] Data export (CSV, PDF)
- [ ] Advanced analytics & ML predictions
- [ ] Multi-user support with roles
- [ ] Dashboard customization
- [ ] Email notifications
- [ ] Data backup & restore
- [ ] API rate limiting
- [ ] Caching layer (Redis)

---

**Backend Ready for Integration! 🎉**

For detailed instructions, see SETUP_GUIDE.md
