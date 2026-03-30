const express = require('express');
const crypto = require('crypto');
const {
  rewards,
  events,
  stands,
  users,
  feed,
  publicUser,
  addFeed,
  issueToken,
  getUserByToken,
} = require('../demo/store');

const router = express.Router();

function requireDemoAuth(req, res, next) {
  const token = req.header('x-auth-token') || req.header('authorization')?.replace('Bearer ', '').trim();
  const user = token ? getUserByToken(token) : null;

  if (!user) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  req.demoUser = user;
  return next();
}

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'demo',
    message: 'API is running in demo mode with in-memory data',
  });
});

router.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Name, email, and password are required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ msg: 'User already exists' });
  }

  const user = {
    id: `user-${crypto.randomUUID()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: 'user',
    credits: 1,
    claimedRewards: [],
    ridesCount: 0,
    treesCount: 0,
    eventsCount: 0,
    postsCount: 0,
    activeRideStandId: null,
  };

  users.push(user);
  addFeed(user.name, 'created a profile', '+1 pts', 'person');
  const token = issueToken(user.id);
  return res.status(201).json({ token, user: publicUser(user) });
});

router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    (entry) => entry.email === String(email).toLowerCase().trim() && entry.password === String(password)
  );

  if (!user) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const token = issueToken(user.id);
  return res.json({ token, user: publicUser(user) });
});

router.get('/api/auth/me', requireDemoAuth, (req, res) => {
  return res.json(publicUser(req.demoUser));
});

router.get('/api/feed', (req, res) => {
  return res.json(feed.slice(0, 20));
});

router.get('/api/rewards', (req, res) => {
  return res.json(rewards);
});

router.post('/api/rewards/claim', requireDemoAuth, (req, res) => {
  const reward = rewards.find((item) => item._id === req.body.rewardId);
  if (!reward) {
    return res.status(404).json({ msg: 'Reward not found' });
  }

  if (req.demoUser.claimedRewards.includes(reward.name)) {
    return res.status(400).json({ msg: 'Reward already claimed' });
  }

  if (req.demoUser.credits < reward.pointsCost) {
    return res.status(400).json({ msg: 'Not enough credits! Keep earning.' });
  }

  req.demoUser.credits -= reward.pointsCost;
  req.demoUser.claimedRewards.push(reward.name);
  addFeed(req.demoUser.name, `claimed ${reward.name}`, `-${reward.pointsCost} pts`, 'redeem');
  return res.json({ msg: `Claimed ${reward.name} successfully!`, user: publicUser(req.demoUser) });
});

router.get('/api/events', (req, res) => {
  return res.json(events);
});

router.post('/api/events/join', requireDemoAuth, (req, res) => {
  const event = events.find((item) => item._id === req.body.eventId);
  if (!event) {
    return res.status(404).json({ msg: 'Event not found' });
  }

  if (event.attendees.includes(req.demoUser.id)) {
    return res.status(400).json({ msg: 'Already joined this event' });
  }

  event.attendees.push(req.demoUser.id);
  req.demoUser.credits += event.pointsReward;
  req.demoUser.eventsCount += 1;
  addFeed(req.demoUser.name, `joined ${event.title}`, `+${event.pointsReward} pts`, event.type === 'cleanup' ? 'mop' : 'forest');
  return res.json({ msg: `Joined successfully. +${event.pointsReward} credits!`, user: publicUser(req.demoUser), event });
});

router.post('/api/events/tree-upload', requireDemoAuth, (req, res) => {
  req.demoUser.credits += 2;
  req.demoUser.treesCount += 1;
  addFeed(req.demoUser.name, 'uploaded tree progress', '+2 pts', 'forest');
  return res.json({ msg: 'Tree progress uploaded! +2 credits earned', user: publicUser(req.demoUser) });
});

router.get('/api/cycles/stands', (req, res) => {
  return res.json(stands);
});

router.post('/api/cycles/book', requireDemoAuth, (req, res) => {
  const stand = stands.find((item) => item._id === req.body.standId);
  if (!stand) {
    return res.status(404).json({ msg: 'Cycle stand not found' });
  }

  if (stand.bikesAvailable <= 0) {
    return res.status(400).json({ msg: 'No bikes available at this stand' });
  }

  if (req.demoUser.activeRideStandId) {
    return res.status(400).json({ msg: 'Complete your current ride before booking another cycle' });
  }

  stand.bikesAvailable -= 1;
  req.demoUser.activeRideStandId = stand._id;
  addFeed(req.demoUser.name, `booked a cycle at ${stand.name}`, '', 'pedal_bike');
  return res.json({ msg: 'Cycle booked successfully', stand });
});

router.post('/api/cycles/scan', requireDemoAuth, (req, res) => {
  if (!req.demoUser.activeRideStandId) {
    return res.status(400).json({ msg: 'No active cycle ride found to complete' });
  }

  const stand = stands.find((item) => item._id === req.demoUser.activeRideStandId);
  if (stand && stand.bikesAvailable < stand.totalBikes) {
    stand.bikesAvailable += 1;
  }

  req.demoUser.activeRideStandId = null;
  req.demoUser.credits += 1;
  req.demoUser.ridesCount += 1;
  addFeed(req.demoUser.name, 'completed a cycle ride', '+1 pts', 'pedal_bike');
  return res.json({ msg: 'Cycle locked! +1 Green Credit earned', user: publicUser(req.demoUser) });
});

router.get('/api/profile/dashboard', requireDemoAuth, (req, res) => {
  return res.json({
    user: publicUser(req.demoUser),
    points: [],
    participations: [],
    rewards: req.demoUser.claimedRewards,
    rides: [],
    treeUpdates: [],
  });
});

router.get('/api/admin/dashboard', requireDemoAuth, (req, res) => {
  if (req.demoUser.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }

  return res.json({
    summary: {
      users: users.length,
      events: events.length,
      participations: events.reduce((count, event) => count + event.attendees.length, 0),
      rewardClaims: users.reduce((count, user) => count + user.claimedRewards.length, 0),
      publicPosts: 1,
      totalPointsEarned: users.reduce((count, user) => count + user.credits, 0),
    },
    latestUsers: users.map(publicUser),
    latestParticipations: [],
  });
});

module.exports = router;
