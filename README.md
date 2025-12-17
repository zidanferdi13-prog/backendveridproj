# VeridFace Backend - MQTT Server

Production-ready Node.js backend for VeridFace device management system with MQTT integration.

## Architecture

```
src/
├── mqtt/
│   ├── client.js              # MQTT connection management
│   ├── topicRouter.js         # Route messages to handlers
│   └── handlers/              # Message handlers by category
│       ├── personalHandler.js
│       ├── recordsHandler.js
│       ├── deviceHandler.js
│       ├── eventHandler.js
│       ├── userPasswordHandler.js
│       └── secretHandler.js
├── controllers/               # Business logic
│   ├── personalController.js
│   ├── recordsController.js
│   ├── deviceController.js
│   ├── eventController.js
│   ├── userPasswordController.js
│   └── secretController.js
├── models/                    # Database models (Mongoose)
│   ├── Device.js
│   ├── Person.js
│   ├── IdentificationRecord.js
│   └── EventLog.js
├── config/
│   └── mqtt.config.js         # MQTT topics configuration
├── utils/
│   ├── logger.js              # Logging
│   └── topicParser.js         # Topic parsing utilities
└── index.js                   # Main entry point
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/veridface
LOG_LEVEL=debug
```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Server Status
```bash
GET /api/status
```

### Publish Message
```bash
POST /api/publish
Content-Type: application/json

{
  "topic": "20211214/cmd/DEVICE001/personCreate",
  "message": {
    "personId": "P001",
    "name": "John Doe",
    "photo": "base64_image_data"
  }
}
```

## MQTT Topics Overview

### Personal Management
- `20211214/cmd/{#deviceSn}/personCreate` - Create personnel
- `20211214/cmd/{#deviceSn}/personDelete` - Delete personnel
- `20211214/cmd/{#deviceSn}/personFind` - Query personnel
- `20211214/cmd/{#deviceSn}/whiteListSync` - Sync whitelist
- `20211214/cmd/{#deviceSn}/registerFeats` - Register features

### Device Management
- `20211214/cmd/{#deviceSn}/setConfig` - Set configuration
- `20211214/cmd/{#deviceSn}/getConfig` - Get configuration
- `20211214/cmd/{#deviceSn}/setNetInfo` - Set network info
- `20211214/cmd/{#deviceSn}/deviceUpgrade` - Device upgrade
- `20211214/cmd/{#deviceSn}/alarm` - Remote control

### Events
- `20211214/event/{#deviceSn}/alarm` - Alarm event
- `20211214/event/{#deviceSn}/heartbeat` - Heartbeat
- `20211214/event/{#deviceSn}/connect` - Connection report
- `20211214/event/{#deviceSn}/dcs` - Door sensor status

[See `src/config/mqtt.config.js` for complete topic list]

## Message Flow

1. **Device sends message** → MQTT Topic
2. **Server receives message** → MQTT Client
3. **TopicRouter parses** → Extract device/command info
4. **Handler processes** → Category-specific handler
5. **Controller executes** → Business logic & database
6. **Response published** → Reply topic

## Adding New Topics

1. Add topic definition to `src/config/mqtt.config.js`
2. Create handler method in appropriate handler file
3. Add routing case in `src/mqtt/topicRouter.js`
4. Implement business logic in controller
5. Add database model if needed

## Logging

All operations are logged to:
- **Console** (colorized for development)
- **logs/error.log** (errors only)
- **logs/combined.log** (all logs)

Adjust `LOG_LEVEL` in `.env`:
- `debug` - Most verbose
- `info` - Normal
- `warn` - Warnings and above
- `error` - Errors only

## Error Handling

- Graceful shutdown on SIGINT (Ctrl+C)
- Automatic MQTT reconnection
- Structured error logging
- HTTP error responses

## Development

### Run with hot reload
```bash
npm run dev
```

### Run tests
```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use PM2 or similar process manager
3. Configure proper MongoDB Atlas or managed instance
4. Set up MQTT broker (Mosquitto, HiveMQ, etc)
5. Enable authentication for MQTT
6. Use HTTPS/SSL for API endpoints
7. Set up monitoring and alerting

## Troubleshooting

**MQTT Connection Failed:**
- Check broker URL in `.env`
- Verify broker is running
- Check credentials if required

**Database Errors:**
- Verify MongoDB is running
- Check connection string in `.env`

**Topic Not Responding:**
- Check topic spelling matches `mqtt.config.js`
- Verify device is subscribed to the topic
- Check handler implementation in controllers

---

**Author:** VeridFace Team  
**License:** Proprietary
