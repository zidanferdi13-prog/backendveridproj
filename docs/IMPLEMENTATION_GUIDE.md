# Implementation Guide

## Complete Architecture Overview

### System Design Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                      MQTT DEVICES (Multi-device)               │
│                                                                 │
│  Device001 --┐     Device002 --┐     Device003 --┐            │
│              │                 │                 │             │
└──────────────┼─────────────────┼─────────────────┼─────────────┘
               │                 │                 │
               └─────────────────┼─────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   MQTT Broker (1883)    │
                    │  (Mosquitto/HiveMQ)     │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼────────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  MQTT Client     │   │  Webhooks   │   │  REST API  │
    │  (Node.js)       │   │  (External) │   │  (Monitoring)
    └────────┬─────────┘   └─────────────┘   └────────────┘
             │
    ┌────────┴──────────────┐
    │   TopicRouter         │
    │  (Decode & Route)     │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────────────────┐
    │        HANDLERS LAYER             │
    │  ┌────────┬────────┬────────┐    │
    │  │Personal│Records │ Device │... │
    │  └────────┴────────┴────────┘    │
    └────────┬──────────────────────────┘
             │
    ┌────────▼──────────────────────────┐
    │     CONTROLLERS LAYER             │
    │  ┌────────┬────────┬────────┐    │
    │  │Personal│Records │ Device │... │
    │  └────────┴────────┴────────┘    │
    └────────┬──────────────────────────┘
             │
    ┌────────▼──────────────────────────┐
    │    MONGODB DATABASE               │
    │  (Collections & Documents)        │
    └───────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Personnel Creation

```
Device → MQTT Broker
  ├─ Topic: 20211214/cmd/DEVICE001/personCreate
  ├─ Payload:
  │  {
  │    "personId": "P001",
  │    "name": "John Doe",
  │    "photo": "base64_encoded_image"
  │  }
  │
Server MQTT Client receives
  │
TopicRouter.routeMessage()
  ├─ Parse: type=cmd, deviceSn=DEVICE001, command=personCreate
  │
PersonalHandler.handlePersonCreate(DEVICE001, payload)
  │
PersonalController.createPerson(DEVICE001, payload)
  │
MongoDB: Insert to "persons" collection
  │
Log: "Person Created Successfully"
```

### Example 2: Device Alarm Event

```
Device → MQTT Broker
  ├─ Topic: 20211214/event/DEVICE001/alarm
  ├─ Payload:
  │  {
  │    "alarmType": "unauthorized_access",
  │    "timestamp": 1700000000,
  │    "location": "entrance"
  │  }
  │
Server receives
  │
EventHandler.handleAlarm(DEVICE001, payload)
  │
EventController.recordAlarm(DEVICE001, payload)
  │
MongoDB: Insert to "eventlogs" collection
  │
Logger: WARN level
```

## Key Implementation Details

### 1. MQTT Client Management

**File:** `src/mqtt/client.js`

- **Single Instance**: One MQTT client per server (manages all devices)
- **Auto-reconnection**: Built-in reconnect with exponential backoff
- **QoS 1**: Guaranteed delivery (at least once)
- **Subscriptions**: Wildcard patterns for multi-device support

```javascript
// Connection pooling handled internally by mqtt.js
const mqttClient = new MQTTClient('mqtt://broker:1883');
await mqttClient.connect();
```

### 2. Topic Routing Strategy

**File:** `src/mqtt/topicRouter.js`

Pattern: `20211214/{type}/{deviceSn}/{command}`

- `type`: `cmd` or `event`
- `deviceSn`: Device serial number
- `command`: Specific command (can have sub-paths like `userpassword/add`)

```javascript
const parsed = TopicParser.parseTopic(topic);
// Returns: { version, type, deviceSn, command, fullTopic }

// Routes to appropriate handler based on command
switch (command) {
  case 'personCreate':
    await personalHandler.handlePersonCreate(deviceSn, payload);
    break;
  // ... more cases
}
```

### 3. Handler Categories

| Handler | Responsible For |
|---------|-----------------|
| `personalHandler` | Personnel CRUD operations |
| `recordsHandler` | Identification records |
| `deviceHandler` | Device config & control |
| `eventHandler` | Device events & monitoring |
| `userPasswordHandler` | User access management |
| `secretHandler` | Security key sync |

Each handler:
- Logs the operation
- Calls appropriate controller
- Handles errors gracefully
- Sends responses back to device

### 4. Controller Layer Pattern

**File:** `src/controllers/*.js`

```javascript
class PersonalController {
  static async createPerson(deviceSn, payload) {
    // 1. Validate payload
    // 2. Query/manipulate database
    // 3. Return result
    // 4. Throw errors if needed
    
    return { id: 'person_123', name: payload.name };
  }
}
```

### 5. Database Models

**MongoDB Collections:**

```javascript
// Device
{
  deviceSn: "DEVICE001",
  deviceName: "Entrance Camera",
  status: "online",
  lastHeartbeat: Date,
  config: { /* nested config */ }
}

// Person
{
  personId: "P001",
  deviceSn: "DEVICE001",
  name: "John Doe",
  whitelisted: true,
  createdAt: Date
}

// IdentificationRecord
{
  deviceSn: "DEVICE001",
  personId: "P001",
  timestamp: Date,
  matchType: "face",
  confidence: 0.98
}

// EventLog
{
  deviceSn: "DEVICE001",
  eventType: "alarm",
  severity: "warning",
  timestamp: Date,
  data: { /* event data */ }
}
```

## Scaling Considerations

### Multi-Device Handling

Server handles multiple devices through:

1. **Topic Subscriptions**: Using `+` wildcard
   ```
   Subscribe: 20211214/cmd/+/personCreate
   Matches: 20211214/cmd/DEVICE001/personCreate
            20211214/cmd/DEVICE002/personCreate
            20211214/cmd/DEVICE003/personCreate
   ```

2. **Device Context**: Extract from parsed topic
   ```javascript
   const deviceSn = parsed.deviceSn; // DEVICE001
   // Query database using deviceSn for device-specific operations
   ```

3. **Indexed Database Queries**
   ```javascript
   // Efficient lookups by deviceSn
   db.devices.find({ deviceSn: "DEVICE001" })
   db.persons.find({ deviceSn: "DEVICE001" })
   db.events.find({ deviceSn: "DEVICE001" })
   ```

### Performance Optimization

1. **Connection Pooling**: MQTT client reuses single connection
2. **Message Batching**: Send multiple messages efficiently
3. **Database Indexing**: Index on `deviceSn` and timestamps
4. **Async Processing**: Non-blocking I/O operations
5. **Graceful Backpressure**: Handle high message volume

## Error Handling Strategy

```javascript
try {
  // Process message
  const result = await handler.process();
} catch (error) {
  // 1. Log error
  logger.error('Processing Error', { error: error.message });
  
  // 2. Send error reply to device
  await mqttClient.publish(replyTopic, {
    status: 'error',
    message: error.message
  });
  
  // 3. Store error event
  await EventLog.create({
    deviceSn,
    eventType: 'error',
    severity: 'error'
  });
}
```

## Adding New Features

### Example: Add New Device Command

**Step 1:** Define topic in `src/config/mqtt.config.js`

```javascript
DEVICE: {
  // ... existing
  newCommand: {
    device: '20211214/cmd/{#deviceSn}/newCommand',
    reply: '20211214/cmd/newCommand_reply',
  }
}
```

**Step 2:** Add subscribe in `SUBSCRIBE_TOPICS`

```javascript
SUBSCRIBE_TOPICS.push('20211214/cmd/+/newCommand');
```

**Step 3:** Create handler in `src/mqtt/handlers/deviceHandler.js`

```javascript
static async handleNewCommand(deviceSn, payload) {
  logger.info('New Command Request', { deviceSn });
  try {
    const result = await deviceController.newCommand(deviceSn, payload);
  } catch (error) {
    logger.error('New Command Error', { deviceSn, error: error.message });
  }
}
```

**Step 4:** Add route in `src/mqtt/topicRouter.js`

```javascript
case 'newCommand':
  await deviceHandler.handleNewCommand(deviceSn, payload);
  break;
```

**Step 5:** Implement controller in `src/controllers/deviceController.js`

```javascript
static async newCommand(deviceSn, payload) {
  // Business logic here
  return { success: true };
}
```

## Monitoring & Debugging

### Viewing Logs

```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Filter by device
grep "DEVICE001" logs/combined.log

# Filter by command
grep "personCreate" logs/combined.log
```

### MQTT Testing with CLI

```bash
# Subscribe to topic
mosquitto_sub -h localhost -t "20211214/cmd/+/personCreate"

# Publish test message
mosquitto_pub -h localhost -t "20211214/cmd/DEVICE001/personCreate" \
  -m '{"personId":"P001","name":"Test"}'
```

### Database Queries

```javascript
// MongoDB queries for debugging
db.devices.find({ deviceSn: "DEVICE001" })
db.eventlogs.find({ deviceSn: "DEVICE001" }).sort({ timestamp: -1 }).limit(10)
db.persons.find({ deviceSn: "DEVICE001" })
```

---

**Next Steps:**
1. Customize controllers with your business logic
2. Configure MongoDB connection
3. Set up MQTT broker
4. Deploy to production
5. Monitor and optimize
