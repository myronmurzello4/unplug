const mongoose = require('mongoose');

const treeProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    plantedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdateAt: {
      type: Date,
      default: Date.now,
    },
    totalUpdates: {
      type: Number,
      default: 0,
      min: 0,
    },
    latestNote: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  { timestamps: true }
);

treeProgressSchema.index({ user: 1, plantName: 1 }, { unique: true });

module.exports = mongoose.model('TreeProgress', treeProgressSchema);
