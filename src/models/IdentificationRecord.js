/**
 * Identification Record Model
 * MongoDB schema for storing identification/attendance records
 */

const mongoose = require('mongoose');

const identificationRecordSchema = new mongoose.Schema(
  {
    deviceSn: {
      type: String,
      required: true,
      index: true,
    },
    personId: String,
    personName: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    matchType: String, // Face match, Fingerprint, etc
    confidence: Number,
    image: String, // URL or base64
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('IdentificationRecord', identificationRecordSchema);
