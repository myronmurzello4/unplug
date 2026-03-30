const crypto = require('crypto');
const express = require('express');
const auth = require('../middleware/auth');
const Reward = require('../models/Reward');
const RewardClaim = require('../models/RewardClaim');
const User = require('../models/User');
const { applyPoints, logActivity } = require('../utils/ledger');

const router = express.Router();

function formatReward(reward) {
  return {
    _id: reward._id,
    name: reward.name,
    emoji: reward.emoji,
    bgCode: reward.bgCode,
    bg: reward.bgCode,
    pointsCost: reward.pointsCost,
    pts: reward.pointsCost,
    category: reward.category,
    partner: reward.partner,
    inventory: reward.inventory,
  };
}

router.get('/', async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true, inventory: { $gt: 0 } }).sort({ pointsCost: 1 });
    return res.json(rewards.map(formatReward));
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/claim', auth, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const reward = await Reward.findById(rewardId);
    if (!reward || !reward.isActive || reward.inventory <= 0) {
      return res.status(404).json({ msg: 'Reward not found' });
    }

    const user = await User.findById(req.user.id);
    const existingClaim = await RewardClaim.findOne({ user: user._id, reward: reward._id });
    if (existingClaim) {
      return res.status(400).json({ msg: 'Reward already claimed' });
    }

    if (user.credits < reward.pointsCost) {
      return res.status(400).json({ msg: 'Not enough credits! Keep earning.' });
    }

    await applyPoints({
      user,
      type: 'spend',
      source: 'reward_claim',
      points: reward.pointsCost,
      referenceModel: 'Reward',
      referenceId: reward._id,
      note: `Claimed ${reward.name}`,
    });

    reward.inventory -= 1;
    await reward.save();

    const claim = await RewardClaim.create({
      user: user._id,
      reward: reward._id,
      rewardName: reward.name,
      pointsSpent: reward.pointsCost,
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
    });

    user.claimedRewards = [...new Set([...(user.claimedRewards || []), reward.name])];
    await user.save();

    await logActivity({
      user,
      actionType: 'reward_claim',
      description: `claimed ${reward.name}`,
      pointsDelta: -reward.pointsCost,
      icon: 'redeem',
      metadata: { claimId: claim._id },
    });

    return res.json({
      msg: `Claimed ${reward.name} successfully!`,
      user: {
        credits: user.credits,
        claimedRewards: user.claimedRewards,
      },
      claim,
    });
  } catch (error) {
    if (error.message === 'Insufficient credits') {
      return res.status(400).json({ msg: 'Not enough credits! Keep earning.' });
    }

    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
