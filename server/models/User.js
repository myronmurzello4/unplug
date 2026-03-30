const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCreditsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCreditsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    claimedRewards: {
      type: [String],
      default: [],
    },
    ridesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    treesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    profile: {
      city: { type: String, trim: true, default: '' },
      bio: { type: String, trim: true, maxlength: 240, default: '' },
      avatarUrl: { type: String, trim: true, default: '' },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
