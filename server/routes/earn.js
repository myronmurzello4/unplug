const express = require('express');
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const Post = require('../models/Post');
const TreeProgress = require('../models/TreeProgress');
const User = require('../models/User');
const { applyPoints, logActivity } = require('../utils/ledger');

const router = express.Router();

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    ridesCount: user.ridesCount,
    treesCount: user.treesCount,
    eventsCount: user.eventsCount,
    claimedRewards: user.claimedRewards || [],
  };
}

function formatEventForClient(event) {
  const startAt = new Date(event.startAt);
  return {
    _id: event._id,
    title: event.title,
    type: event.type,
    organization: event.organization,
    org: event.organization ? `by ${event.organization}` : 'Community event',
    description: event.description,
    date: startAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: startAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    location: event.location.name,
    loc: event.location.name,
    pointsReward: event.pointsReward,
    pts: event.pointsReward,
    emoji: event.emoji,
    emo: event.emoji,
    attendeesCount: event.stats ? event.stats.joinedCount : event.attendees.length,
    status: event.status,
    createdAt: event.createdAt,
  };
}

router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ visibility: 'public', status: { $in: ['published', 'completed'] } })
      .sort({ startAt: 1 })
      .lean();

    return res.json(events.map(formatEventForClient));
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, description, organization, startAt, endAt, location, pointsReward, emoji } = req.body;

    if (!title || !type || !description || !startAt || !location || !location.name) {
      return res.status(400).json({ msg: 'Title, type, description, start time, and location are required' });
    }

    const user = await User.findById(req.user.id);
    const event = await Event.create({
      title: String(title).trim(),
      type,
      description: String(description).trim(),
      organization: organization ? String(organization).trim() : user.name,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : undefined,
      location: {
        name: String(location.name).trim(),
        address: location.address ? String(location.address).trim() : '',
        city: location.city ? String(location.city).trim() : '',
      },
      pointsReward: Number(pointsReward) > 0 ? Number(pointsReward) : 5,
      emoji: emoji || (type === 'plantation' ? '🌳' : '🧹'),
      createdBy: user._id,
      status: 'published',
    });

    user.postsCount += 1;
    await user.save();

    await Post.create({
      author: user._id,
      authorName: user.name,
      title: event.title,
      content: event.description,
      category: type === 'plantation' ? 'plantation-update' : 'cleanup-update',
      visibility: 'public',
      event: event._id,
    });

    await logActivity({
      user,
      actionType: 'event_create',
      description: `created ${event.title}`,
      icon: type === 'plantation' ? 'forest' : 'mop',
      metadata: { eventId: event._id },
    });

    return res.status(201).json({ event: formatEventForClient(event), msg: 'Event posted successfully' });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/join', auth, async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'published') {
      return res.status(404).json({ msg: 'Event not found' });
    }

    let participation = await Participation.findOne({ user: req.user.id, event: event._id });
    if (participation && participation.status !== 'cancelled') {
      return res.status(400).json({ msg: 'Already joined this event' });
    }

    const user = await User.findById(req.user.id);

    if (!participation) {
      participation = await Participation.create({
        user: user._id,
        event: event._id,
        status: 'joined',
      });
    } else {
      participation.status = 'joined';
      await participation.save();
    }

    if (!event.attendees.some((attendeeId) => attendeeId.toString() === user._id.toString())) {
      event.attendees.push(user._id);
    }

    event.stats.joinedCount = await Participation.countDocuments({ event: event._id, status: { $in: ['joined', 'attended'] } });
    await event.save();

    user.eventsCount += 1;
    await user.save();

    await applyPoints({
      user,
      type: 'earn',
      source: 'event_join',
      points: event.pointsReward,
      referenceModel: 'Participation',
      referenceId: participation._id,
      note: `Joined ${event.title}`,
    });

    participation.status = 'attended';
    participation.pointsAwarded = event.pointsReward;
    participation.checkedInAt = new Date();
    await participation.save();

    event.stats.attendedCount = await Participation.countDocuments({ event: event._id, status: 'attended' });
    await event.save();

    await logActivity({
      user,
      actionType: 'event_join',
      description: `joined ${event.title}`,
      pointsDelta: event.pointsReward,
      icon: event.type === 'plantation' ? 'forest' : 'mop',
      metadata: { eventId: event._id },
    });

    return res.json({
      msg: `Joined successfully. +${event.pointsReward} credits!`,
      credits: user.credits,
      user: serializeUser(user),
      event: formatEventForClient(event),
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/tree-upload', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const plantName = req.body.plantName ? String(req.body.plantName).trim() : 'Mango Sapling #2';
    const note = req.body.note ? String(req.body.note).trim() : 'Uploaded a new tree progress update';

    let progress = await TreeProgress.findOne({ user: user._id, plantName });
    if (!progress) {
      progress = await TreeProgress.create({
        user: user._id,
        plantName,
        latestNote: note,
        totalUpdates: 0,
      });
    }

    progress.totalUpdates += 1;
    progress.lastUpdateAt = new Date();
    progress.latestNote = note;
    await progress.save();

    user.treesCount = await TreeProgress.countDocuments({ user: user._id });
    await user.save();

    await applyPoints({
      user,
      type: 'earn',
      source: 'tree_progress',
      points: 2,
      referenceModel: 'TreeProgress',
      referenceId: progress._id,
      note,
    });

    await Post.create({
      author: user._id,
      authorName: user.name,
      title: `${plantName} progress update`,
      content: note,
      category: 'tree-update',
      visibility: 'public',
    });

    await logActivity({
      user,
      actionType: 'tree_upload',
      description: 'uploaded tree progress',
      pointsDelta: 2,
      icon: 'forest',
      metadata: { treeProgressId: progress._id },
    });

    return res.json({
      msg: 'Tree progress uploaded! +2 credits earned',
      credits: user.credits,
      user: serializeUser(user),
      progress,
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
