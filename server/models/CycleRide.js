const mongoose = require('mongoose');

const cycleRideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CycleStand',
      required: true,
    },
    standName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['booked', 'completed', 'cancelled'],
      default: 'booked',
      index: true,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

cycleRideSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('CycleRide', cycleRideSchema);
