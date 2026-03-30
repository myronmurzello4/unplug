const express = require('express');
const Activity = require('../models/Activity');
const Post = require('../models/Post');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [activities, posts] = await Promise.all([
      Activity.find({ isPublic: true }).sort({ createdAt: -1 }).limit(15).lean(),
      Post.find({ visibility: 'public' }).sort({ isPinned: -1, createdAt: -1 }).limit(10).lean(),
    ]);

    const postFeed = posts.map((post) => ({
      _id: post._id,
      userName: post.authorName,
      description: `shared an update: ${post.title}`,
      pointsEarned: '',
      icon:
        post.category === 'cleanup-update'
          ? 'mop'
          : post.category === 'plantation-update' || post.category === 'tree-update'
            ? 'forest'
            : 'campaign',
      createdAt: post.createdAt,
      actionType: 'post_create',
    }));

    const combined = [...activities, ...postFeed]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 20);

    return res.json(combined);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
