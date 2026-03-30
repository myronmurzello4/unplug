const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 260,
    },
    pointsEarned: {
      type: String,
      default: '',
    },
    pointsDelta: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: 'stars',
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
