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
      connectTimeout: 10000,
      reconnectPeriod: 1000,
      ...options,
    };
  }

  /**
   * Connect to MQTT Broker
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, this.options);

        this.client.on('connect', () => {
          this.connected = true;
          logger.info('✓ Connected to MQTT Broker', { broker: this.brokerUrl });
          this.subscribeToTopics();
          resolve();
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

        this.client.on('error', (error) => {
          logger.error('MQTT Client Error', { error: error.message });
        });

        this.client.on('offline', () => {
          this.connected = false;
          logger.warn('MQTT Client Offline');
        });

        this.client.on('disconnect', () => {
          logger.info('Disconnected from MQTT Broker');
        });

        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('MQTT Connection Timeout'));
          }
        }, 15000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to all configured topics
   */
  subscribeToTopics() {
    SUBSCRIBE_TOPICS.forEach((topic) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          logger.error('Subscribe Error', { topic, error: error.message });
        } else {
          logger.debug('Subscribed to topic', { topic });
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  async handleMessage(topic, message) {
    try {
      logger.debug('Message Received', { topic, payload: message.toString() });

      const payload = JSON.parse(message.toString());
      await topicRouter.routeMessage(topic, payload);
    } catch (error) {
      logger.error('Message Handling Error', {
        topic,
        error: error.message,
      });
    }
  }

  /**
   * Publish message to topic
   */
  publish(topic, payload) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('MQTT Client not connected'));
        return;
      }

      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          logger.error('Publish Error', { topic, error: error.message });
          reject(error);
        } else {
          logger.debug('Message Published', { topic });
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect from broker
   */
  disconnect() {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(() => {
          this.connected = false;
          logger.info('Disconnected from MQTT Broker');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }
}

module.exports = MQTTClient;
