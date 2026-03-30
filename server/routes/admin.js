const express = require('express');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const PointTransaction = require('../models/PointTransaction');
const RewardClaim = require('../models/RewardClaim');
const Post = require('../models/Post');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/dashboard', async (req, res) => {
  try {
    const [userCount, eventCount, participationCount, totalPointsEarned, rewardClaimsCount, postsCount, latestUsers, latestParticipations] =
      await Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Participation.countDocuments(),
        PointTransaction.aggregate([
          { $match: { type: 'earn' } },
          { $group: { _id: null, total: { $sum: '$points' } } },
        ]),
        RewardClaim.countDocuments(),
        Post.countDocuments({ visibility: 'public' }),
        User.find().select('-password').sort({ createdAt: -1 }).limit(10),
        Participation.find().populate('user', 'name email').populate('event', 'title type').sort({ createdAt: -1 }).limit(10),
      ]);

    return res.json({
      summary: {
        users: userCount,
        events: eventCount,
        participations: participationCount,
        rewardClaims: rewardClaimsCount,
        publicPosts: postsCount,
        totalPointsEarned: totalPointsEarned[0]?.total || 0,
      },
      latestUsers,
      latestParticipations,
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email').sort({ startAt: -1 });
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/participations', async (req, res) => {
  try {
    const participations = await Participation.find()
      .populate('user', 'name email')
      .populate('event', 'title type startAt')
      .sort({ createdAt: -1 });
    return res.json(participations);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/points', async (req, res) => {
  try {
    const points = await PointTransaction.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
    return res.json(points);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/reward-claims', async (req, res) => {
  try {
    const claims = await RewardClaim.find().populate('user', 'name email').populate('reward', 'name category').sort({ createdAt: -1 });
    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name email').populate('event', 'title type').sort({ createdAt: -1 });
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
