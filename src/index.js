/**
 * Main Entry Point
 * Railway-safe bootstrap
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const MQTTClient = require('./mqtt/client');
const logger = require('./utils/logger');
const {
  connectDatabase,
  disconnectDatabase,
  isConnected,
} = require('./config/database.config');

const app = express();

const PORT = process.env.PORT ;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL; // ⛔ NO FALLBACK

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/user', require('./api/userAPI'));
app.use('/device', require('./api/deviceAPI'));
app.use('/permission', require('./api/permissionAPI'));
app.use('/visitor', require('./api/visitorAPI'));
app.use('/report', require('./api/reportAPI'));
app.use('/attendance', require('./api/attendanceAPI'));
app.use('/attendancesys', require('./api/attendancesysAPI'));
app.use('/log', require('./api/logAPI'));
app.use('/settings', require('./api/settingsAPI'));
app.use('/dashboard', require('./api/dashboardAPI'));

// MQTT related
const { TOPICS } = require('./config/mqtt.config');
const TopicParser = require('./utils/topicParser');
const MQTTPublisher = require('./utils/mqttPublisher');

// Globals
let mqttClient = null;
let publisher = null;

// Root
app.get('/', (req, res) => {
  res.send('Backend Railway OK 🚀');
});

/**
 * MQTT init (NON BLOCKING)
 */
function initializeMQTT() {
  if (!MQTT_BROKER_URL) {
    logger.warn('MQTT_BROKER_URL not set, MQTT disabled');
    return;
  }

  mqttClient = new MQTTClient(MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  mqttClient.connect(); // 🔥 fire & forget
  publisher = new MQTTPublisher(mqttClient);

  app.locals.mqttClient = mqttClient;
  app.locals.publisher = publisher;

  logger.info('MQTT initialized');
}

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: mqttClient?.isConnected() ? 'connected' : 'disconnected',
    database: isConnected() ? 'connected' : 'disconnected',
    dbHost: process.env.MYSQLHOST,
    timestamp: new Date(),
  });
});

/**
 * Status
 */
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    mqtt: {
      connected: mqttClient?.isConnected() || false,
      broker: MQTT_BROKER_URL || 'not-configured',
    },
    database: {
      connected: isConnected(),
    },
    uptime: process.uptime(),
  });
});

/**
 * Publish endpoints (UNCHANGED)
 */
app.post('/api/publish', async (req, res) => {
  const { topic, message } = req.body;
  if (!topic || !message) {
    return res.status(400).json({ error: 'topic and message required' });
  }

  if (!mqttClient?.isConnected()) {
    return res.status(503).json({ error: 'MQTT not connected' });
  }

  try {
    await mqttClient.publish(topic, message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start server (HTTP FIRST)
 */
async function start() {
  // Start HTTP immediately
  app.listen(PORT, () => {
    logger.info(`✓ Server running on port ${PORT}`);
  });

  // DB async init
  connectDatabase()
    .then(() => logger.info('Database initialized'))
    .catch((err) =>
      logger.error('Database init failed', { error: err.message })
    );

  // MQTT async init
  initializeMQTT();
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (mqttClient) await mqttClient.disconnect();
  await disconnectDatabase();
  process.exit(0);
});

// GO 🚀
start();
