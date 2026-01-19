# Quick Start Guide - Complete Backend API

This guide will help you quickly set up and test the complete backend implementation.

## Prerequisites

- Node.js (v14 or higher)
- MySQL/MariaDB (v5.7 or higher)
- MQTT Broker (Mosquitto recommended)
- Git

## Installation Steps

### 1. Clone and Install Dependencies

```bash
cd /path/to/backendveridproj
npm install
```

### 2. Set Up Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS veridface;"

# Run base schema
mysql -u root -p veridface < docs/DATABASE_SCHEMA_NEW.sql

# Run additional tables
mysql -u root -p veridface < docs/ADDITIONAL_TABLES.sql
```

### 3. Configure Environment

Create `.env` file:

```bash
cat > .env << EOF
# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=veridface

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
EOF
```

### 4. Start MQTT Broker

```bash
# Install Mosquitto (if not installed)
# Ubuntu/Debian:
sudo apt-get install mosquitto mosquitto-clients

# macOS:
brew install mosquitto

# Start Mosquitto
mosquitto -v
```

### 5. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

## Verification

### 1. Check System Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "mqtt": "connected",
  "database": "connected",
  "timestamp": "2024-01-19T..."
}
```

### 2. Run Validation Script

```bash
cd tests
./validate_api.sh
```

This will test all major API endpoints and display results.

### 3. Test Dashboard

```bash
curl http://localhost:3000/dashboard/stats
```

Expected response:
```json
{
  "data": {
    "devices": {
      "total": 0,
      "online": 0,
      "offline": 0
    },
    "access": {
      "today": 0
    },
    "visitors": {
      "today": 0
    },
    "users": {
      "total": 0
    },
    "alarms": {
      "today": 0
    }
  }
}
```

## Testing with Sample Data

### 1. Add a Device

```bash
curl -X POST http://localhost:3000/device/devicedata/adddevice \
  -H "Content-Type: application/json" \
  -d '{
    "device_sn": "DEVICE001",
    "device_model": "VF203",
    "device_name": "Main Entrance",
    "device_location": "Building A - Floor 1",
    "device_group": "Main Doors",
    "device_note": "Primary entrance device"
  }'
```

### 2. Add a User

```bash
curl -X POST http://localhost:3000/user/userdata/adduser \
  -H "Content-Type: application/json" \
  -d '{
    "username": "John Doe",
    "mobile": "1234567890",
    "email": "john@example.com",
    "group_name": "Default Group",
    "employee_number": "EMP-001",
    "note": "Test user"
  }'
```

### 3. Create Attendance Group

```bash
curl -X POST http://localhost:3000/attendancesys/groups/add \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Day Shift Group",
    "description": "Regular day shift employees",
    "work_start_time": "09:00:00",
    "work_end_time": "17:00:00",
    "late_threshold": 15
  }'
```

### 4. View Dashboard Stats

```bash
curl http://localhost:3000/dashboard/stats | jq
```

## Testing MQTT Integration

### 1. Subscribe to MQTT Topics (in separate terminal)

```bash
mosquitto_sub -v -t '20211214/#'
```

### 2. Send Remote Unlock Command

First, get device ID from database:
```bash
mysql -u root -p veridface -e "SELECT id_device, device_sn FROM m_devices;"
```

Then send unlock command:
```bash
curl -X POST http://localhost:3000/device/devicedata/remote \
  -H "Content-Type: application/json" \
  -d '{
    "id_device": "your-device-uuid-here",
    "remote_command": "1"
  }'
```

You should see the MQTT message in the mosquitto_sub terminal.

### 3. Simulate Device Connection

```bash
# Publish connection event
mosquitto_pub -t '20211214/event/connect' \
  -m '{"deviceSn": "DEVICE001", "timestamp": 1234567890}'
```

Check device status:
```bash
mysql -u root -p veridface -e "SELECT device_sn, status, last_connect_report FROM m_devices WHERE device_sn='DEVICE001';"
```

### 4. Simulate Access Record

```bash
mosquitto_pub -t '20211214/event/DEVICE001/reportRecords' \
  -m '{
    "data": [{
      "personId": "EMP-001",
      "personName": "John Doe",
      "userType": 303,
      "passTimestamp": 1705680000,
      "result": 0,
      "message": "Success",
      "temperature": 36.5
    }]
  }'
```

Check access records:
```bash
curl http://localhost:3000/log/logdata/access?limit=5 | jq
```

Check attendance records:
```bash
curl http://localhost:3000/attendance/attendancedata | jq
```

## Common Issues

### Issue: MQTT not connected

**Solution:**
```bash
# Check if Mosquitto is running
ps aux | grep mosquitto

# Start Mosquitto
mosquitto -v

# Check MQTT_BROKER_URL in .env
```

### Issue: Database connection failed

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials
mysql -u root -p veridface -e "SELECT 1;"

# Check DB_* variables in .env
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Change PORT in .env to different port
# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

## API Documentation

Full API documentation available in:
- `docs/COMPLETE_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `docs/API_ENDPOINTS.md` - Detailed endpoint documentation
- `README.md` - Project overview

## Testing Endpoints

### User Management
```bash
# List users
curl http://localhost:3000/user/userdata

# Add user with MQTT sync
curl -X POST http://localhost:3000/user/userdata/adduser \
  -H "Content-Type: application/json" \
  -d '{"username":"Test","mobile":"123","email":"test@test.com","photo_base64":"...","registered_device_sn":"DEVICE001"}'
```

### Attendance System
```bash
# Dashboard
curl http://localhost:3000/attendancesys/dashboard

# Groups
curl http://localhost:3000/attendancesys/groups

# Shifts
curl http://localhost:3000/attendancesys/shifts

# Statistics
curl "http://localhost:3000/attendance/attendancedata/statistics?start_date=2024-01-01&end_date=2024-01-31"
```

### Visitor Management
```bash
# List visitors
curl http://localhost:3000/visitor/visitordata

# Review applications
curl "http://localhost:3000/visitor/visitordata/review?status=pending"
```

### Logs
```bash
# Access logs
curl "http://localhost:3000/log/logdata/access?limit=20"

# Alarm logs
curl "http://localhost:3000/log/logdata/alarm?limit=10"

# Operation logs
curl "http://localhost:3000/log/logdata/operation?limit=10"
```

## Monitoring

### View Logs
```bash
# Combined logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Filter for MQTT messages
tail -f logs/combined.log | grep MQTT
```

### Check Database
```bash
# View tables
mysql -u root -p veridface -e "SHOW TABLES;"

# Check record counts
mysql -u root -p veridface -e "
SELECT 
  (SELECT COUNT(*) FROM m_devices) as devices,
  (SELECT COUNT(*) FROM m_persons) as persons,
  (SELECT COUNT(*) FROM attendance_records) as attendance,
  (SELECT COUNT(*) FROM t_identification_records) as access_records;
"
```

## Production Deployment

For production deployment, refer to:
- `docs/COMPLETE_IMPLEMENTATION_SUMMARY.md` - Deployment checklist
- Add authentication (JWT/OAuth)
- Enable HTTPS/TLS
- Configure firewall rules
- Set up monitoring (PM2, Prometheus)
- Configure backup strategy
- Implement rate limiting
- Use environment-specific configs

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review `docs/COMPLETE_IMPLEMENTATION_SUMMARY.md`
3. Test endpoints with validation script
4. Check MQTT broker connectivity
5. Verify database schema is up to date

## What's Implemented

✅ 80+ API endpoints
✅ Full MQTT integration
✅ Attendance automation
✅ Visitor management
✅ Real-time dashboard
✅ Comprehensive logging
✅ Device control
✅ Permission management
✅ Batch operations
✅ Export capabilities

The system is fully functional and ready for development/testing!
