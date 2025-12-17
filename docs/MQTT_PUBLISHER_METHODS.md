# MQTTPublisher - Complete Method Reference

Auto-generated convenience methods for publishing all MQTT commands to devices.

## Quick Usage

```javascript
// Get publisher instance (set up in src/index.js startup)
const publisher = app.locals.publisher; // or require/import singleton

// Publish any command with full payload control
const requestId = await publisher.sendCommand(deviceSn, command, payload);

// Or use convenience methods with auto-formatted payload
await publisher.personCreate(deviceSn, { personId, name, photo, features });
await publisher.setConfig(deviceSn, { configObject });
await publisher.restartDevice(deviceSn, { force: false });
```

## All Available Methods

### Generic Methods

#### `sendCommand(deviceSn, command, payload)`
Send a command to any device. Payload is passed as-is.
- **Returns**: requestId (string) for correlation
- **Params**:
  - `deviceSn` (string): Device serial number
  - `command` (string): Command name (e.g., 'personCreate', 'setConfig', 'userpassword/add')
  - `payload` (object): Command data (matches what frontend sends)

```javascript
const requestId = await publisher.sendCommand('DEVICE001', 'personCreate', {
  personId: 'P001',
  name: 'John Doe',
  photo: 'base64_data',
  features: { ... }
});
```

#### `sendReply(replyTopic, payload, success)`
Publish a reply message to a device (from handler).
- **Params**:
  - `replyTopic` (string): Topic to publish reply to
  - `payload` (object): Reply data
  - `success` (boolean, default true): Indicates success or error

```javascript
await publisher.sendReply('20211214/cmd/personCreate_reply', {
  requestId: 'req_...',
  personId: 'P001',
  created: true
}, true);
```

#### `broadcast(command, payload)`
Send broadcast command to all devices.

```javascript
await publisher.broadcast('maintenance', { startTime: Date.now() });
```

### Personal Management Commands

#### `personCreate(deviceSn, payload)`
Create person on device.

```javascript
await publisher.personCreate('DEVICE001', {
  personId: 'P001',
  name: 'John Doe',
  photo: 'base64_...',
  features: { face: '...' }
});
```

#### `personDelete(deviceSn, payload)`
Delete person from device.

```javascript
await publisher.personDelete('DEVICE001', { personId: 'P001' });
```

#### `personFind(deviceSn, payload)`
Query person from device.

```javascript
await publisher.personFind('DEVICE001', { personId: 'P001' });
```

#### `whiteListSync(deviceSn, payload)`
Synchronize whitelist to device.

```javascript
await publisher.whiteListSync('DEVICE001', {
  persons: [{ personId: 'P001', name: 'John' }],
  replaceAll: true
});
```

#### `whiteListFind(deviceSn, payload)`
Query whitelist from device.

```javascript
await publisher.whiteListFind('DEVICE001', {});
```

#### `registerFeats(deviceSn, payload)`
Register person features on device.

```javascript
await publisher.registerFeats('DEVICE001', {
  personId: 'P001',
  features: { face: '...', fingerprint: '...' }
});
```

### Identification Records Commands

#### `deleteRecords(deviceSn, payload)`
Delete records from device.

```javascript
await publisher.deleteRecords('DEVICE001', {
  recordIds: ['rec1', 'rec2'],
  fromDate: 1700000000000,
  toDate: Date.now()
});
```

#### `findRecords(deviceSn, payload)`
Query records from device.

```javascript
await publisher.findRecords('DEVICE001', {
  fromDate: 1700000000000,
  toDate: Date.now(),
  limit: 100,
  personId: 'P001' // optional filter
});
```

#### `reportRecords(deviceSn, payload)`
Request/send records report.

```javascript
await publisher.reportRecords('DEVICE001', {
  reportType: 'daily',
  date: '2024-12-01'
});
```

### Device Management Commands

#### `setConfig(deviceSn, payload)`
Set device configuration.

```javascript
await publisher.setConfig('DEVICE001', {
  displayMode: 'attendance',
  volume: 80,
  timezone: 'UTC+7'
});
```

#### `getConfig(deviceSn, payload = {})`
Get device configuration.

```javascript
const requestId = await publisher.getConfig('DEVICE001');
```

#### `setNetInfo(deviceSn, payload)`
Set network information.

```javascript
await publisher.setNetInfo('DEVICE001', {
  dhcp: true,
  ip: '192.168.1.100',
  gateway: '192.168.1.1',
  dns: '8.8.8.8'
});
```

#### `setTime(deviceSn, payload)`
Set device time/date.

```javascript
await publisher.setTime('DEVICE001', {
  timestamp: Date.now(),
  timezone: 'UTC+7'
});
```

#### `restartDevice(deviceSn, payload = {})`
Restart device.

```javascript
await publisher.restartDevice('DEVICE001', { delay: 5000 });
```

#### `deviceReset(deviceSn, payload = {})`
Factory reset device.

```javascript
await publisher.deviceReset('DEVICE001', { resetData: true });
```

#### `deviceDisable(deviceSn, payload)`
Disable or enable device.

```javascript
await publisher.deviceDisable('DEVICE001', { enable: false, reason: 'maintenance' });
```

#### `deviceUpgrade(deviceSn, payload)`
Upgrade device firmware.

```javascript
await publisher.deviceUpgrade('DEVICE001', {
  url: 'http://server.com/firmware.bin',
  checksum: 'sha256_...',
  version: '2.0.1'
});
```

#### `deviceInformation(deviceSn, payload = {})`
Query device information.

```javascript
const requestId = await publisher.deviceInformation('DEVICE001');
```

#### `cameraCalibrate(deviceSn, payload)`
Calibrate device camera.

```javascript
await publisher.cameraCalibrate('DEVICE001', { mode: 'auto' });
```

#### `control(deviceSn, payload)`
Remote control device.

```javascript
await publisher.control('DEVICE001', {
  action: 'open_door', // or 'lock', 'unlock', 'display_message'
  duration: 5000
});
```

#### `extractLog(deviceSn, payload = {})`
Extract logs from device.

```javascript
await publisher.extractLog('DEVICE001', {
  logType: 'system',
  fromDate: 1700000000000,
  toDate: Date.now()
});
```

#### `password(deviceSn, payload)`
Set device password/PIN.

```javascript
await publisher.password('DEVICE001', {
  password: 'newpass123',
  type: 'admin'
});
```

### User Password Management

#### `userPasswordAdd(deviceSn, payload)`
Add user password to device.

```javascript
await publisher.userPasswordAdd('DEVICE001', {
  username: 'admin',
  password: 'pass123',
  permission: 'full_access',
  expiryDate: 1735689600000 // optional
});
```

#### `userPasswordDelete(deviceSn, payload)`
Delete user password from device.

```javascript
await publisher.userPasswordDelete('DEVICE001', { username: 'admin' });
```

#### `userPasswordFind(deviceSn, payload = {})`
Query user passwords from device.

```javascript
await publisher.userPasswordFind('DEVICE001', {});
```

### Secret Sync (VG103 Dynamic Code)

#### `secretSync(deviceSn, payload)`
Synchronize secret/dynamic code to device.

```javascript
await publisher.secretSync('DEVICE001', {
  secret: 'encrypted_code',
  expiryTime: 3600, // seconds
  algorithm: 'totp'
});
```

## Usage in Handlers/Controllers

```javascript
// In a handler (after controller processes request)
const { TOPICS } = require('../config/mqtt.config');
const TopicParser = require('../utils/topicParser');

async function handlePersonCreate(deviceSn, payload) {
  // 1. Call controller
  const result = await personalController.createPerson(deviceSn, payload);
  
  // 2. Publish reply if needed
  const publisher = app.locals.publisher; // injected from startup
  const replyTopic = TOPICS.PERSONAL.personCreate.reply;
  await publisher.sendReply(replyTopic, {
    requestId: payload.requestId,
    status: 'success',
    personId: result.id
  });
}
```

## Integration in src/index.js

```javascript
const MQTTPublisher = require('./utils/mqttPublisher');

// After mqttClient.connect()
const publisher = new MQTTPublisher(app.locals.mqttClient);
app.locals.publisher = publisher;
```

## Notes

- All methods return `requestId` (from `sendCommand`) for correlation.
- Payload is passed through as-is — validate in controllers before calling.
- Each method creates message with `timestamp` + `requestId` automatically.
- For device-specific reply topics, use `TopicParser.buildTopic()` if template includes `{#deviceSn}`.

---

**Total methods**: 30+ convenience methods covering all MQTT commands.
