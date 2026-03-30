const Activity = require('../models/Activity');
const PointTransaction = require('../models/PointTransaction');

async function logActivity({
  user,
  actionType,
  description,
  pointsDelta = 0,
  icon = 'stars',
  isPublic = true,
  metadata = {},
}) {
  return Activity.create({
    user: user ? user._id : undefined,
    userName: user ? user.name : 'Community',
    actionType,
    description,
    pointsDelta,
    pointsEarned: pointsDelta === 0 ? '' : `${pointsDelta > 0 ? '+' : ''}${pointsDelta} pts`,
    icon,
    isPublic,
    metadata,
  });
}

async function applyPoints({
  user,
  type,
  source,
  points,
  referenceModel = '',
  referenceId,
  note = '',
}) {
  if (!user) {
    throw new Error('User is required for points transaction');
  }

  if (type === 'spend' && user.credits < points) {
    throw new Error('Insufficient credits');
  }

  const signedPoints = type === 'spend' ? -Math.abs(points) : Math.abs(points);
  user.credits += signedPoints;

  if (user.credits < 0) {
    throw new Error('Credits balance cannot be negative');
  }

  if (signedPoints > 0) {
    user.totalCreditsEarned += signedPoints;
  } else {
    user.totalCreditsSpent += Math.abs(signedPoints);
  }

  await user.save();

  await PointTransaction.create({
    user: user._id,
    type,
    source,
    points: signedPoints,
    balanceAfter: user.credits,
    referenceModel,
    referenceId,
    note,
  });

  return user;
}

module.exports = {
  applyPoints,
  logActivity,
};
