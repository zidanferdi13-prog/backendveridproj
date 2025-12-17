/**
 * Main Entry Point
 * Initialize server, MQTT connection, and start listening
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const MQTTClient = require('./mqtt/client');
const logger = require('./utils/logger');
const { connectDatabase, disconnectDatabase, isConnected } = require('./config/database.config');

const app = express();
const PORT = process.env.PORT || 3000;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

// Middleware
app.use(express.json());
app.use(cors());

const { TOPICS } = require('./config/mqtt.config');
const TopicParser = require('./utils/topicParser');
const MQTTPublisher = require('./utils/mqttPublisher');

// Global MQTT client instance
let mqttClient = null;
let publisher = null;

/**
 * Initialize MQTT Connection
 */
async function initializeMQTT() {
  try {
    mqttClient = new MQTTClient(MQTT_BROKER_URL, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    });

    await mqttClient.connect();
    logger.info('MQTT Client initialized and connected');

    // Initialize publisher with MQTT client
    publisher = new MQTTPublisher(mqttClient);
    
    // Store in app for use in routes and handlers
    app.locals.mqttClient = mqttClient;
    app.locals.publisher = publisher;
  } catch (error) {
    logger.error('Failed to initialize MQTT', { error: error.message });
    process.exit(1);
  }
}

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: mqttClient?.isConnected() ? 'connected' : 'disconnected',
    database: isConnected() ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

/**
 * Status Endpoint
 */
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    mqtt: {
      connected: mqttClient?.isConnected() || false,
      broker: MQTT_BROKER_URL,
    },
    database: {
      connected: isConnected(),
    },
    uptime: process.uptime(),
  });
});

/**
 * Example: Publish message endpoint
 * POST /api/publish
 * Body: { topic, message }
 */
app.post('/api/publish', async (req, res) => {
  const { topic, message } = req.body;

  if (!topic || !message) {
    return res.status(400).json({ error: 'topic and message required' });
  }

  try {
    await mqttClient.publish(topic, message);
    res.json({ success: true, topic, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Publish command to a specific device (used by frontend)
 * POST /api/device/:deviceSn/command
 * Body: { category: 'DEVICE'|'PERSONAL'|..., command: 'setConfig', message: {...}, topic?: '<full topic override>' }
 */
app.post('/api/device/:deviceSn/command', async (req, res) => {
  const { deviceSn } = req.params;
  const { category, command, message, topic: overrideTopic } = req.body;

  if (!overrideTopic && (!category || !command)) {
    return res.status(400).json({ error: 'Provide either `topic` or (`category` and `command`)' });
  }

  try {
    const topicToPublish = overrideTopic
      ? overrideTopic
      : (TOPICS[category] && TOPICS[category][command] && TOPICS[category][command].device)
        ? TopicParser.buildTopic(TOPICS[category][command].device, deviceSn)
        : null;

    if (!topicToPublish) {
      return res.status(400).json({ error: 'Topic template not found for given category/command' });
    }

    await mqttClient.publish(topicToPublish, message || {});
    res.json({ success: true, topic: topicToPublish });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Publish command using convenience method from MQTTPublisher
 * POST /api/device/:deviceSn/:command
 * Body: { payload: {...} }
 * 
 * Example: POST /api/device/DEVICE001/setConfig
 * Body: { "payload": { "timezone": "UTC+7" } }
 */
app.post('/api/device/:deviceSn/:command', async (req, res) => {
  const { deviceSn, command } = req.params;
  const { payload = {} } = req.body;

  try {
    if (!publisher) {
      return res.status(503).json({ error: 'Publisher not initialized' });
    }

    // Check if convenience method exists
    if (typeof publisher[command] === 'function') {
      const requestId = await publisher[command](deviceSn, payload);
      res.json({ success: true, command, deviceSn, requestId });
    } else {
      // Fallback to generic sendCommand
      const requestId = await publisher.sendCommand(deviceSn, command, payload);
      res.json({ success: true, command, deviceSn, requestId });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled Error', { error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

/**
 * Start Server
 */
async function start() {
  try {
    // Initialize Database
    await connectDatabase();

    // Initialize MQTT
    await initializeMQTT();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
      logger.info(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (mqttClient) {
    await mqttClient.disconnect();
  }
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
start();
