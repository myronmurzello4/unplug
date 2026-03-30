const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['joined', 'attended', 'cancelled'],
      default: 'joined',
      index: true,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkedInAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

participationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Participation', participationSchema);
