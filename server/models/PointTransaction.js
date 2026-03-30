const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['earn', 'spend'],
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceModel: {
      type: String,
      default: '',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

pointTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
