const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    {
      user: {
        id: user._id,
        role: user.role,
      },
    },
    process.env.JWT_SECRET || 'supersecretgreenkey',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  signToken,
};
