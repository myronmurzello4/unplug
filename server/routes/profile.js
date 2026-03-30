const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const Participation = require('../models/Participation');
const RewardClaim = require('../models/RewardClaim');
const CycleRide = require('../models/CycleRide');
const TreeProgress = require('../models/TreeProgress');

const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  try {
    const [user, points, participations, rewards, rides, treeUpdates] = await Promise.all([
      User.findById(req.user.id).select('-password'),
      PointTransaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20),
      Participation.find({ user: req.user.id }).populate('event', 'title type startAt location pointsReward').sort({ createdAt: -1 }),
      RewardClaim.find({ user: req.user.id }).sort({ createdAt: -1 }),
      CycleRide.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20),
      TreeProgress.find({ user: req.user.id }).sort({ updatedAt: -1 }),
    ]);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json({
      user,
      points,
      participations,
      rewards,
      rides,
      treeUpdates,
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
