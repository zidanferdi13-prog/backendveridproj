/**
 * Person Model
 * MongoDB schema for personnel management
 */

const mongoose = require('mongoose');

const personSchema = new mongoose.Schema(
  {
    personId: {
      type: String,
      unique: true,
      required: true,
    },
    deviceSn: {
      type: String,
      required: true,
      index: true,
    },
    name: String,
    photo: String,
    features: mongoose.Schema.Types.Mixed,
    whitelisted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Person', personSchema);
