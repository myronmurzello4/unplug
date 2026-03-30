const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    type: {
      type: String,
      enum: ['plantation', 'cleanup'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    emoji: {
      type: String,
      default: '',
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    location: {
      name: { type: String, required: true, trim: true, maxlength: 160 },
      address: { type: String, trim: true, maxlength: 260, default: '' },
      city: { type: String, trim: true, maxlength: 80, default: '' },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    capacity: {
      type: Number,
      min: 1,
      default: 100,
    },
    pointsReward: {
      type: Number,
      min: 0,
      default: 5,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'completed', 'cancelled'],
      default: 'published',
      index: true,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    stats: {
      joinedCount: { type: Number, default: 0, min: 0 },
      attendedCount: { type: Number, default: 0, min: 0 },
      treesPlanted: { type: Number, default: 0, min: 0 },
      wasteCollectedKg: { type: Number, default: 0, min: 0 },
      updatesCount: { type: Number, default: 0, min: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

eventSchema.index({ type: 1, status: 1, startAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
