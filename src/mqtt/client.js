const mqtt = require('mqtt');
const logger = require('../utils/logger');
const { SUBSCRIBE_TOPICS } = require('../config/mqtt.config');
const topicRouter = require('./topicRouter');

class MQTTClient {
  constructor(brokerUrl, options = {}) {
    this.brokerUrl = brokerUrl;
    this.client = null;
    this.connected = false;

    this.options = {
      clientId: `veridface-server-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 10 * 1000,
      reconnectPeriod: 5 * 1000, // lebih aman di cloud
      keepalive: 60,
      ...options,
    };
  }

  /**
   * Connect to MQTT Broker
   * ⚠️ TIDAK reject app startup
   */
  connect() {
    try {
      logger.info('Connecting to MQTT Broker...', {
        broker: this.brokerUrl,
      });

      this.client = mqtt.connect(this.brokerUrl, this.options);

      this.client.on('connect', () => {
        this.connected = true;
        logger.info('✓ Connected to MQTT Broker', {
          broker: this.brokerUrl,
        });

        this.subscribeToTopics();
      });

      this.client.on('reconnect', () => {
        logger.warn('MQTT reconnecting...');
      });

      this.client.on('offline', () => {
        this.connected = false;
        logger.warn('MQTT client offline');
      });

      this.client.on('error', (error) => {
        logger.error('MQTT Client Error', {
          error: error?.message || 'unknown error',
        });
        // ⛔ JANGAN throw / reject
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      logger.error('MQTT Init Error', {
        error: error.message,
      });
    }
  }

  /**
   * Subscribe to all configured topics
   */
  subscribeToTopics() {
    if (!this.client) return;

    SUBSCRIBE_TOPICS.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          logger.error('Subscribe Error', {
            topic,
            error: error.message,
          });
        } else {
          logger.info('Subscribed to topic', { topic });
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  async handleMessage(topic, message) {
    try {
      const payloadStr = message.toString();
      logger.debug('Message Received', {
        topic,
        payload: payloadStr,
      });

      const payload = JSON.parse(payloadStr);
      await topicRouter.routeMessage(topic, payload);
    } catch (error) {
      logger.error('Message Handling Error', {
        topic,
        error: error.message,
      });
    }
  }

  /**
   * Publish message
   */
  publish(topic, payload) {
    if (!this.connected) {
      logger.warn('Publish skipped, MQTT not connected', { topic });
      return;
    }

    const message =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    this.client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        logger.error('Publish Error', {
          topic,
          error: error.message,
        });
      } else {
        logger.debug('Message Published', { topic });
      }
    });
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.client) {
      this.client.end(false, () => {
        this.connected = false;
        logger.info('MQTT disconnected');
      });
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = MQTTClient;
