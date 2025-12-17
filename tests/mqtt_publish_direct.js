// Simple MQTT publisher to simulate a device sending a message to server
// Usage: node tests/mqtt_publish_direct.js

require('dotenv').config();
const mqtt = require('mqtt');
const broker = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

const client = mqtt.connect(broker);

client.on('connect', () => {
  console.log('Publisher connected to broker:', broker);

  const topic = '20211214/cmd/J257280001/getConfig';
  const message = {
    personId: 'P001',
    name: 'Test Person',
    photo: '',
    timestamp: Date.now(),
  };

  client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
    if (err) console.error('Publish error:', err.message);
    else console.log('Published to', topic, '\nPayload:', message);
    setTimeout(() => client.end(), 500);
  });
});

client.on('error', (err) => {
  console.error('Publisher error:', err.message);
});
