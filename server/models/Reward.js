const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    emoji: {
      type: String,
      default: '',
    },
    bgCode: {
      type: String,
      default: '#e8f5e9',
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    partner: {
      type: String,
      trim: true,
      default: '',
    },
    inventory: {
      type: Number,
      default: 1000,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reward', rewardSchema);
