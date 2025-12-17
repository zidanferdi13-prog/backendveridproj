Testing the backend locally (no device required)

Requirements:
- MQTT broker (local Mosquitto or public test broker)
- Node.js installed
- Run server: `npm install` then `npm run dev`

Common broker options:
- Local Mosquitto: mqtt://localhost:1883
- Public test broker: mqtt://test.mosquitto.org:1883

Set `MQTT_BROKER_URL` in `.env` if needed.

1) Start the server

```powershell
cd "d:\Project VeridFace\Backend Dev"
npm install
npm run dev
```

2) In another terminal, run a subscriber to observe server publishes and replies

```powershell
node tests/mqtt_subscribe.js
```

You should see subscriber connect and subscribe confirmation.

3) Test REST -> MQTT publish (server publishes to device topic)

Open a different terminal and run (PowerShell):

```powershell
curl -X POST http://localhost:3000/api/device/DEVICE001/command `
  -H "Content-Type: application/json" `
  -d '{
    "category":"DEVICE",
    "command":"setConfig",
    "message": { "timezone": "UTC+7" }
  }'
```

If server publishes correctly, the `node tests/mqtt_subscribe.js` output should show a message on `20211214/cmd/DEVICE001/setConfig`.

4) Test a device -> server message (simulate device publish)

```powershell
node tests/mqtt_publish_direct.js
```

This will publish to `20211214/cmd/DEVICE001/personCreate` — server should receive it (check server console logs and `logs/combined.log`).

5) Alternative: Using mosquitto CLI

Subscribe:

```powershell
mosquitto_sub -h localhost -t "20211214/cmd/DEVICE001/#" -v
```

Publish:

```powershell
mosquitto_pub -h localhost -t "20211214/cmd/DEVICE001/personCreate" -m '{"personId":"P001","name":"Test Person"}'
```

Debugging tips:
- Check `npm run dev` console for logs like "Message Received" or handler logs.
- Check `logs/combined.log` and `logs/error.log` files.
- If no messages received, verify broker URL and that server subscribed to the topic patterns in `src/config/mqtt.config.js`.

Next steps:
- If tests pass, we can implement controller persistence or reply-publish logic in handlers.
