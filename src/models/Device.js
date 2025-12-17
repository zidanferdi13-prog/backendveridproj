/**
 * Device Model
 * MongoDB schema for device management
 */

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceSn: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceName: String,
    deviceType: String,
    status: {
      type: String,
      enum: ['online', 'offline', 'error'],
      default: 'offline',
    },
    lastHeartbeat: Date,
    config: mongoose.Schema.Types.Mixed,
    networkInfo: mongoose.Schema.Types.Mixed,
    deviceInfo: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
