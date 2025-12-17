/**
 * Event Log Model
 * MongoDB schema for logging device events
 */

const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema(
  {
    deviceSn: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['alarm', 'heartbeat', 'lwt', 'connect', 'dcs', 'onlineCheck'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },
    message: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventLog', eventLogSchema);
