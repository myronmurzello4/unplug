const crypto = require('crypto');

const tokens = new Map();

const rewards = [
  { _id: 'reward-1', name: 'IndiGo 20% Off', emoji: '✈️', bgCode: '#e8f0fe', bg: '#e8f0fe', pointsCost: 100, pts: 100, category: 'Travel' },
  { _id: 'reward-2', name: 'Zomato Gold 1mo', emoji: '🍽️', bgCode: '#fff3e0', bg: '#fff3e0', pointsCost: 75, pts: 75, category: 'Food' },
  { _id: 'reward-3', name: 'Amazon Gift', emoji: '🛒', bgCode: '#e8f5e9', bg: '#e8f5e9', pointsCost: 80, pts: 80, category: 'Shopping' },
];

const events = [
  { _id: 'event-1', title: 'Cubbon Park Tree Drive', type: 'plantation', organization: 'GreenBengaluru', org: 'by GreenBengaluru', description: 'Community plantation drive.', date: 'Apr 5', time: '7:00 AM', location: 'Cubbon Park Gate', loc: 'Cubbon Park Gate', pointsReward: 5, pts: 5, emoji: '🌳', emo: '🌳', attendees: [] },
  { _id: 'event-2', title: 'Bellandur Lake Cleanup', type: 'cleanup', organization: 'CleanLakes India', org: 'by CleanLakes India', description: 'Cleanup drive near the lake.', date: 'Apr 8', time: '6:30 AM', location: 'Bellandur Ext Road', loc: 'Bellandur Ext Road', pointsReward: 5, pts: 5, emoji: '🧹', emo: '🧹', attendees: [] },
];

const stands = [
  { _id: 'stand-1', name: 'MG Road Station', distanceText: '0.3 km', bikesAvailable: 4, totalBikes: 6 },
  { _id: 'stand-2', name: 'Indiranagar Hub', distanceText: '0.8 km', bikesAvailable: 2, totalBikes: 8 },
  { _id: 'stand-3', name: 'Koramangala Loop', distanceText: '1.2 km', bikesAvailable: 3, totalBikes: 5 },
];

const users = [
  {
    id: 'demo-admin',
    name: 'Urban Oasis Admin',
    email: 'admin@urbanoasis.app',
    password: 'TempAdmin@123',
    role: 'admin',
    credits: 120,
    claimedRewards: [],
    ridesCount: 3,
    treesCount: 2,
    eventsCount: 1,
    postsCount: 1,
    activeRideStandId: null,
  },
];

const feed = [
  {
    _id: 'activity-1',
    userName: 'Urban Oasis Admin',
    description: 'shared an update: Welcome to Urban Oasis',
    pointsEarned: '',
    icon: 'campaign',
    createdAt: new Date().toISOString(),
  },
];

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    claimedRewards: [...user.claimedRewards],
    ridesCount: user.ridesCount,
    treesCount: user.treesCount,
    eventsCount: user.eventsCount,
    postsCount: user.postsCount,
  };
}

function addFeed(userName, description, pointsEarned, icon) {
  feed.unshift({
    _id: crypto.randomUUID(),
    userName,
    description,
    pointsEarned,
    icon,
    createdAt: new Date().toISOString(),
  });
}

function issueToken(userId) {
  const token = `demo-${crypto.randomUUID()}`;
  tokens.set(token, userId);
  return token;
}

function getUserByToken(token) {
  const userId = tokens.get(token);
  return users.find((user) => user.id === userId) || null;
}

module.exports = {
  rewards,
  events,
  stands,
  users,
  feed,
  publicUser,
  addFeed,
  issueToken,
  getUserByToken,
};
