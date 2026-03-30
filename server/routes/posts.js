const express = require('express');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Event = require('../models/Event');
const { logActivity } = require('../utils/ledger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ visibility: 'public' }).sort({ isPinned: -1, createdAt: -1 }).limit(50);
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category = 'general', eventId, visibility = 'public' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content are required' });
    }

    let event = null;
    if (eventId) {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ msg: 'Related event not found' });
      }
    }

    const user = await User.findById(req.user.id);
    const post = await Post.create({
      author: user._id,
      authorName: user.name,
      title: String(title).trim(),
      content: String(content).trim(),
      category,
      visibility,
      event: event ? event._id : undefined,
    });

    user.postsCount += 1;
    await user.save();

    if (event) {
      event.stats.updatesCount += 1;
      await event.save();
    }

    await logActivity({
      user,
      actionType: 'post_create',
      description: `shared an update: ${post.title}`,
      icon:
        category === 'cleanup-update'
          ? 'mop'
          : category === 'plantation-update' || category === 'tree-update'
            ? 'forest'
            : 'campaign',
      metadata: { postId: post._id },
    });

    return res.status(201).json({ msg: 'Post published successfully', post });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
