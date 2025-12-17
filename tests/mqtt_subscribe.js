// Simple MQTT subscriber for testing server publishes and replies
// Usage: node tests/mqtt_subscribe.js

require('dotenv').config();
const mqtt = require('mqtt');
const broker = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

const client = mqtt.connect(broker);

client.on('connect', () => {
  console.log('Subscriber connected to broker:', broker);
  // Subscribe to a specific device topic to see server publishes
  client.subscribe('20211214/cmd/DEVICE001/#', { qos: 1 }, (err) => {
    if (err) console.error('Subscribe error:', err.message);
    else console.log('Subscribed to 20211214/cmd/DEVICE001/#');
  });

  // Also subscribe to common reply topics
  client.subscribe('20211214/cmd/personCreate_reply', { qos: 1 }, (err) => {
    if (err) console.error('Subscribe error:', err.message);
    else console.log('Subscribed to 20211214/cmd/personCreate_reply');
  });
});

client.on('message', (topic, message) => {
  let payload = message.toString();
  try { payload = JSON.parse(payload); } catch (e) {}
  console.log('\n<< Message Received >>');
  console.log('Topic:', topic);
  console.log('Payload:', payload);
});

client.on('error', (err) => {
  console.error('Subscriber error:', err.message);
});
