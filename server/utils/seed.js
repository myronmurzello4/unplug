const bcrypt = require('bcrypt');
const CycleStand = require('../models/CycleStand');
const Event = require('../models/Event');
const Reward = require('../models/Reward');
const User = require('../models/User');
const Post = require('../models/Post');

const defaultStands = [
  { name: 'MG Road Station', distanceText: '0.3 km', bikesAvailable: 4, totalBikes: 6, city: 'Bengaluru' },
  { name: 'Indiranagar Hub', distanceText: '0.8 km', bikesAvailable: 2, totalBikes: 8, city: 'Bengaluru' },
  { name: 'Koramangala Loop', distanceText: '1.2 km', bikesAvailable: 3, totalBikes: 5, city: 'Bengaluru' },
  { name: 'BTM Junction', distanceText: '1.9 km', bikesAvailable: 7, totalBikes: 10, city: 'Bengaluru' },
];

const defaultRewards = [
  { emoji: '✈️', bgCode: '#e8f0fe', name: 'IndiGo 20% Off', pointsCost: 100, category: 'Travel', partner: 'IndiGo' },
  { emoji: '🍽️', bgCode: '#fff3e0', name: 'Zomato Gold 1mo', pointsCost: 75, category: 'Food', partner: 'Zomato' },
  { emoji: '🏨', bgCode: '#f3e5f5', name: 'OYO Hotel Stay', pointsCost: 150, category: 'Hotels', partner: 'OYO' },
  { emoji: '🛒', bgCode: '#e8f5e9', name: 'Amazon ₹500 Gift', pointsCost: 80, category: 'Shopping', partner: 'Amazon' },
  { emoji: '☕', bgCode: '#fce4ec', name: 'Starbucks Treat', pointsCost: 50, category: 'Cafe', partner: 'Starbucks' },
  { emoji: '🎬', bgCode: '#e3f2fd', name: 'BookMyShow 2 Tix', pointsCost: 90, category: 'Events', partner: 'BookMyShow' },
];

const defaultEvents = [
  {
    title: 'Cubbon Park Tree Drive',
    type: 'plantation',
    description: 'Community plantation drive focused on native saplings and long-term care updates.',
    organization: 'GreenBengaluru',
    startAt: new Date('2026-04-05T07:00:00+05:30'),
    endAt: new Date('2026-04-05T10:00:00+05:30'),
    location: { name: 'Cubbon Park Gate', address: 'Cubbon Park Main Gate', city: 'Bengaluru' },
    pointsReward: 5,
    emoji: '🌳',
  },
  {
    title: 'Bellandur Lake Cleanup',
    type: 'cleanup',
    description: 'Neighborhood cleanup drive focused on lake-side waste removal and segregation.',
    organization: 'CleanLakes India',
    startAt: new Date('2026-04-08T06:30:00+05:30'),
    endAt: new Date('2026-04-08T09:30:00+05:30'),
    location: { name: 'Bellandur Ext Road', address: 'Bellandur Lake access road', city: 'Bengaluru' },
    pointsReward: 5,
    emoji: '🧹',
  },
];

async function ensureDefaultData() {
  if ((await CycleStand.countDocuments()) === 0) {
    await CycleStand.insertMany(defaultStands);
  }

  if ((await Reward.countDocuments()) === 0) {
    await Reward.insertMany(defaultRewards);
  }

  if ((await Event.countDocuments()) === 0) {
    await Event.insertMany(defaultEvents);
  }

  let adminUser = null;
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });

    if (!adminUser) {
      const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      adminUser = await User.create({
        name: process.env.ADMIN_NAME || 'Urban Oasis Admin',
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        password,
        role: 'admin',
        credits: 0,
      });
    }
  }

  if (adminUser && (await Post.countDocuments()) === 0) {
    await Post.create({
      author: adminUser._id,
      authorName: adminUser.name,
      title: 'Welcome to Urban Oasis',
      content: 'Community updates, cleanup drives, and plantation progress shared here are visible to everyone in the app.',
      category: 'announcement',
      visibility: 'public',
      isPinned: true,
    });
  }
}

module.exports = {
  ensureDefaultData,
};
