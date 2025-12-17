# Quick Start Guide

## ⚡ 30-Minute Setup

### Prerequisites

- Node.js 14+
- npm or yarn
- MQTT Broker (Mosquitto) running
- MongoDB running

### Step 1: Install & Configure (5 min)

```bash
# Navigate to project
cd "d:\Project VeridFace\Backend Dev"

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your values
# - MQTT_BROKER_URL
# - MONGODB_URI
# - PORT
```

### Step 2: Start Server (2 min)

```bash
# Development mode (auto-restart)
npm run dev

# You should see:
# ✓ Connected to MQTT Broker
# ✓ Server running on http://localhost:3000
# ✓ Health check: http://localhost:3000/health
```

### Step 3: Test Connection (3 min)

```bash
# In another terminal, test the health endpoint
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "mqtt": "connected",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### Step 4: Send Test Message (5 min)

**Option A: Using curl**

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "20211214/cmd/DEVICE001/personCreate",
    "message": {
      "personId": "P001",
      "name": "Test Person",
      "photo": ""
    }
  }'
```

**Option B: Using MQTT CLI**

```bash
# Subscribe to device
mosquitto_sub -h localhost -t "20211214/cmd/+/personCreate"

# In another terminal, publish
mosquitto_pub -h localhost \
  -t "20211214/cmd/DEVICE001/personCreate" \
  -m '{"personId":"P001","name":"Test","photo":""}'
```

### Step 5: Check Logs (5 min)

```bash
# View real-time logs
tail -f logs/combined.log

# Should see:
# [timestamp] [info]: Message Received
# [timestamp] [info]: Person Created Successfully
```

## ✅ Common First Steps

### 1. Test with Real Device

```bash
# Start server in one terminal
npm run dev

# Device publishes to:
# 20211214/cmd/YOUR_DEVICE_SN/personCreate

# Server automatically:
# - Receives message
# - Routes to personalHandler
# - Logs operation
# - Stores in database
```

### 2. Create Custom Handler

Edit `src/controllers/deviceController.js`:

```javascript
static async setConfig(deviceSn, payload) {
  // Add your logic here
  logger.debug('Setting device config', { deviceSn, payload });
  
  // Example: Update device in database
  // const device = await Device.findOneAndUpdate(
  //   { deviceSn },
  //   { config: payload.config }
  // );
  
  return { success: true };
}
```

### 3. Add New Topic

1. Add to `src/config/mqtt.config.js`
2. Add handler method
3. Add router case
4. Implement controller logic

### 4. Monitor Devices

Check device status:

```bash
# List all devices
curl http://localhost:3000/api/devices

# Get specific device
curl http://localhost:3000/api/devices/DEVICE001

# Get device events
curl http://localhost:3000/api/devices/DEVICE001/events?limit=10
```

## 🐛 Troubleshooting

### Issue: MQTT Connection Failed

```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Check if Mosquitto is running
mosquitto -v

# Or use public MQTT broker for testing:
# MQTT_BROKER_URL=mqtt://test.mosquitto.org:1883
```

### Issue: Cannot Connect to MongoDB

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veridface
```

### Issue: Topic Not Receiving Messages

1. Check topic name matches config
2. Verify subscription pattern
3. Check device SN in topic path
4. Verify MQTT broker is working

```bash
# Test with mosquitto CLI
mosquitto_sub -h localhost -v -t '20211214/cmd/+/personCreate'
```

## 📊 File Structure Created

```
Backend Dev/
├── src/
│   ├── index.js                          # Main entry
│   ├── config/
│   │   └── mqtt.config.js               # Topic definitions
│   ├── mqtt/
│   │   ├── client.js                    # MQTT connection
│   │   ├── topicRouter.js               # Route messages
│   │   └── handlers/                    # 6 handler files
│   ├── controllers/                     # 6 controller files
│   ├── models/                          # 4 MongoDB models
│   └── utils/
│       ├── logger.js                    # Logging
│       ├── topicParser.js               # Topic parsing
│       └── mqttPublisher.js             # Helper for publishing
├── package.json
├── .env.example
├── .gitignore
├── README.md                            # Full documentation
├── IMPLEMENTATION_GUIDE.md              # Deep dive guide
└── QUICK_START.md                       # This file
```

## 🚀 Next Steps

1. **Customize Controllers**: Add your business logic
2. **Add API Routes**: Create REST endpoints for device management
3. **Implement Authentication**: Add JWT or API key auth
4. **Add WebSockets**: Real-time dashboard updates
5. **Deploy**: Use PM2, Docker, or cloud provider

## 📚 Learn More

- **MQTT**: See `src/config/mqtt.config.js` for all topics
- **Architecture**: Read `IMPLEMENTATION_GUIDE.md`
- **Full Docs**: Read `README.md`
- **API**: See endpoints in `src/index.js`

## 💡 Tips

- Use `npm run dev` for development (auto-reload)
- Check `logs/combined.log` for all events
- Test with MQTT CLI before deploying device code
- Use `LOG_LEVEL=debug` in `.env` for verbose logging
- Keep `.env` out of version control (use .gitignore)

---

**Happy coding!** 🎉

Need help? Check the error logs:
```bash
tail -f logs/error.log
```
