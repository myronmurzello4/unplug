const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const auth = require('../middleware/auth');
const RewardClaim = require('../models/RewardClaim');
const { signToken } = require('../utils/auth');
const { applyPoints, logActivity } = require('../utils/ledger');

const router = express.Router();

function serializeUser(user, claimedRewards = []) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    claimedRewards,
    ridesCount: user.ridesCount,
    treesCount: user.treesCount,
    eventsCount: user.eventsCount,
    postsCount: user.postsCount,
    createdAt: user.createdAt,
    profile: user.profile,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, city, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ msg: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      profile: {
        city: city ? String(city).trim() : '',
        bio: bio ? String(bio).trim() : '',
      },
    });

    await applyPoints({
      user,
      type: 'earn',
      source: 'signup',
      points: 1,
      referenceModel: 'User',
      referenceId: user._id,
      note: 'Signup reward',
    });

    await logActivity({
      user,
      actionType: 'signup',
      description: 'created a profile',
      pointsDelta: 1,
      icon: 'person',
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: serializeUser(user, []),
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.status !== 'active') {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const claimedRewards = await RewardClaim.find({ user: user._id }).sort({ createdAt: -1 }).select('rewardName -_id');
    const token = signToken(user);

    return res.json({
      token,
      user: serializeUser(
        user,
        claimedRewards.map((reward) => reward.rewardName)
      ),
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const claims = await RewardClaim.find({ user: user._id }).sort({ createdAt: -1 }).select('rewardName -_id');
    return res.json(serializeUser(user, claims.map((claim) => claim.rewardName)));
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
