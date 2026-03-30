const mongoose = require('mongoose');

const cycleStandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    distanceText: {
      type: String,
      default: '',
    },
    bikesAvailable: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalBikes: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CycleStand', cycleStandSchema);
