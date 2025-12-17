# API Endpoints Reference

## Health & Status

### GET /health
Check server and MQTT connection status.

**Response:**
```json
{
  "status": "ok",
  "mqtt": "connected",
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### GET /api/status
Get detailed server status.

**Response:**
```json
{
  "server": "running",
  "mqtt": {
    "connected": true,
    "broker": "mqtt://localhost:1883"
  },
  "uptime": 3600.5
}
```

---

## Publishing Commands

### POST /api/publish
Publish arbitrary MQTT message (raw topic + message).

**Body:**
```json
{
  "topic": "20211214/cmd/DEVICE001/personCreate",
  "message": { "personId": "P001", "name": "John" }
}
```

**Response:**
```json
{
  "success": true,
  "topic": "20211214/cmd/DEVICE001/personCreate",
  "message": { "personId": "P001", "name": "John" }
}
```

**Use case**: Direct MQTT publish when you have full topic path.

---

### POST /api/device/:deviceSn/command
Publish command using topic template from config (with dynamic `{#deviceSn}` replacement).

**Parameters:**
- `deviceSn` (URL param): Device serial number

**Body (Option 1 - using category/command):**
```json
{
  "category": "DEVICE",
  "command": "setConfig",
  "message": {
    "timezone": "UTC+7",
    "volume": 80
  }
}
```

**Body (Option 2 - using full topic override):**
```json
{
  "topic": "20211214/cmd/DEVICE001/customCommand",
  "message": { "custom": "data" }
}
```

**Response:**
```json
{
  "success": true,
  "topic": "20211214/cmd/DEVICE001/setConfig"
}
```

**Use case**: Frontend knows category/command or can build full topic; server handles `{#deviceSn}` replacement.

---

### POST /api/device/:deviceSn/:command
Publish command using MQTTPublisher convenience methods (auto-injects requestId, timestamp).

**Parameters:**
- `deviceSn` (URL param): Device serial number  
- `command` (URL param): Command name (e.g., `setConfig`, `personCreate`, `restartDevice`)

**Body:**
```json
{
  "payload": {
    "timezone": "UTC+7",
    "volume": 80
  }
}
```

**Response:**
```json
{
  "success": true,
  "command": "setConfig",
  "deviceSn": "DEVICE001",
  "requestId": "req_1700000000_abcd1234"
}
```

**Use case**: Cleanest API for frontend; server handles topic building, requestId injection, message wrapping. Method auto-routes to appropriate `publisher.<command>()`.

---

## Examples

### Example 1: Set Device Configuration

```bash
curl -X POST http://localhost:3000/api/device/DEVICE001/setConfig \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "timezone": "UTC+7",
      "displayMode": "attendance",
      "volume": 80
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "command": "setConfig",
  "deviceSn": "DEVICE001",
  "requestId": "req_1700000000_xyz789"
}
```

### Example 2: Create Person

```bash
curl -X POST http://localhost:3000/api/device/DEVICE001/personCreate \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "personId": "P001",
      "name": "John Doe",
      "photo": "base64_encoded_image",
      "features": {
        "face": "face_feature_data"
      }
    }
  }'
```

### Example 3: Restart Device

```bash
curl -X POST http://localhost:3000/api/device/DEVICE001/restartDevice \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "delay": 5000
    }
  }'
```

### Example 4: Upgrade Firmware

```bash
curl -X POST http://localhost:3000/api/device/DEVICE001/deviceUpgrade \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "url": "http://server.com/firmware_v2.0.1.bin",
      "checksum": "sha256_hash_here",
      "version": "2.0.1"
    }
  }'
```

### Example 5: User Password Add

```bash
curl -X POST http://localhost:3000/api/device/DEVICE001/userPasswordAdd \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "username": "admin",
      "password": "pass123",
      "permission": "full_access",
      "expiryDate": 1735689600000
    }
  }'
```

### Example 6: Whitelist Sync

```bash
curl -X POST http://localhost:3000/api/device/DEVICE001/whiteListSync \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "persons": [
        { "personId": "P001", "name": "John" },
        { "personId": "P002", "name": "Jane" }
      ],
      "replaceAll": true
    }
  }'
```

---

## Message Format

All messages published via endpoints automatically include:
- `requestId`: Unique identifier for correlation (auto-generated if not provided)
- `timestamp`: Current epoch milliseconds

**Final MQTT message on broker:**
```json
{
  "requestId": "req_1700000000_xyz789",
  "timestamp": 1700000000000,
  "payload": {
    // your payload data here
  }
}
```

**Device can use `requestId` to correlate replies.**

---

## Available Commands (POST /api/device/:deviceSn/:command)

### Personal Management
- `personCreate`
- `personDelete`
- `personFind`
- `whiteListSync`
- `whiteListFind`
- `registerFeats`

### Records
- `deleteRecords`
- `findRecords`
- `reportRecords`

### Device Management
- `setConfig`
- `getConfig`
- `setNetInfo`
- `setTime`
- `restartDevice`
- `deviceReset`
- `deviceDisable`
- `deviceUpgrade`
- `deviceInformation`
- `cameraCalibrate`
- `control`
- `extractLog`
- `password`

### User Password
- `userPasswordAdd`
- `userPasswordDelete`
- `userPasswordFind`

### Secret
- `secretSync`

---

## Error Responses

**400 Bad Request** (missing parameters):
```json
{
  "error": "Topic template not found for given category/command"
}
```

**503 Service Unavailable** (publisher not initialized):
```json
{
  "error": "Publisher not initialized"
}
```

**500 Internal Server Error** (publish failed):
```json
{
  "error": "Error message details"
}
```

---

## Frontend Integration Example (JavaScript)

```javascript
// Generic publish function
async function publishCommand(deviceSn, command, payload) {
  const response = await fetch(`/api/device/${deviceSn}/${command}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('Publish failed:', result.error);
    return null;
  }
  
  console.log('Requested with requestId:', result.requestId);
  return result.requestId;
}

// Usage examples
await publishCommand('DEVICE001', 'setConfig', { timezone: 'UTC+7' });
await publishCommand('DEVICE001', 'personCreate', { personId: 'P001', name: 'John' });
await publishCommand('DEVICE001', 'restartDevice', { delay: 5000 });
```

---

## Notes

- All endpoints return JSON.
- Use `requestId` from response to correlate device replies.
- Server logs all publishes to `logs/combined.log`.
- For realtime device replies, device should publish to corresponding reply topic.
