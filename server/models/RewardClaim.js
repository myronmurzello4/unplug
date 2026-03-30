const mongoose = require('mongoose');

const rewardClaimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      required: true,
      index: true,
    },
    rewardName: {
      type: String,
      required: true,
      trim: true,
    },
    pointsSpent: {
      type: Number,
      required: true,
      min: 1,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['issued', 'redeemed'],
      default: 'issued',
      index: true,
    },
  },
  { timestamps: true }
);

rewardClaimSchema.index({ user: 1, reward: 1 }, { unique: true });

module.exports = mongoose.model('RewardClaim', rewardClaimSchema);
