const express = require('express');
const auth = require('../middleware/auth');
const CycleStand = require('../models/CycleStand');
const CycleRide = require('../models/CycleRide');
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

router.get('/stands', async (req, res) => {
  try {
    const stands = await CycleStand.find({ isActive: true }).sort({ createdAt: 1 });
    return res.json(stands);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/book', auth, async (req, res) => {
  try {
    const { standId } = req.body;
    const stand = await CycleStand.findById(standId);

    if (!stand || !stand.isActive) {
      return res.status(404).json({ msg: 'Cycle stand not found' });
    }

    if (stand.bikesAvailable <= 0) {
      return res.status(400).json({ msg: 'No bikes available at this stand' });
    }

    const activeRide = await CycleRide.findOne({ user: req.user.id, status: 'booked' });
    if (activeRide) {
      return res.status(400).json({ msg: 'Complete your current ride before booking another cycle' });
    }

    stand.bikesAvailable -= 1;
    await stand.save();

    const user = await User.findById(req.user.id);
    await CycleRide.create({
      user: user._id,
      stand: stand._id,
      standName: stand.name,
      status: 'booked',
    });

    await logActivity({
      user,
      actionType: 'cycle_book',
      description: `booked a cycle at ${stand.name}`,
      icon: 'pedal_bike',
      metadata: { standId: stand._id },
    });

    return res.json({ msg: 'Cycle booked successfully', stand });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/scan', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ride = await CycleRide.findOne({ user: user._id, status: 'booked' }).sort({ createdAt: -1 });

    if (!ride) {
      return res.status(400).json({ msg: 'No active cycle ride found to complete' });
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    ride.pointsAwarded = 1;
    await ride.save();

    const stand = await CycleStand.findById(ride.stand);
    if (stand && stand.bikesAvailable < stand.totalBikes) {
      stand.bikesAvailable += 1;
      await stand.save();
    }

    user.ridesCount += 1;
    await user.save();

    await applyPoints({
      user,
      type: 'earn',
      source: 'cycle_ride',
      points: 1,
      referenceModel: 'CycleRide',
      referenceId: ride._id,
      note: `Completed ride from ${ride.standName}`,
    });

    await logActivity({
      user,
      actionType: 'cycle_scan',
      description: 'completed a cycle ride',
      pointsDelta: 1,
      icon: 'pedal_bike',
      metadata: { rideId: ride._id },
    });

    return res.json({ msg: 'Cycle locked! +1 Green Credit earned', credits: user.credits, user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
