/**
 * Topic Parser Utility
 * Parse MQTT topics to extract deviceSn and command type
 */

class TopicParser {
  /**
   * Parse MQTT topic
   * Format: 20211214/[cmd|event]/{#deviceSn}/{command}
   * Example: 20211214/cmd/DEVICE001/personCreate
   */
  static parseTopic(topic) {
    const parts = topic.split('/');

    if (parts.length < 4) {
      return null;
    }

    return {
      version: parts[0],           // 20211214
      type: parts[1],              // cmd or event
      deviceSn: parts[2],          // Device serial number
      command: parts.slice(3).join('/'), // Command (can have sub-paths)
      fullTopic: topic,
    };
  }

  /**
   * Replace device serial number in topic template
   * Example: "20211214/cmd/{#deviceSn}/personCreate" -> "20211214/cmd/DEVICE001/personCreate"
   */
  static buildTopic(topicTemplate, deviceSn) {
    return topicTemplate.replace('{#deviceSn}', deviceSn);
  }

  /**
   * Check if topic matches pattern (for subscription)
   * Pattern: "20211214/cmd/+/personCreate"
   * Topic: "20211214/cmd/DEVICE001/personCreate"
   */
  static matchTopic(pattern, topic) {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length !== topicParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
        return false;
      }
    }

    return true;
  }
}

module.exports = TopicParser;
