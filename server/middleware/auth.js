const jwt = require('jsonwebtoken');

function getTokenFromRequest(req) {
  const bearer = req.header('authorization');
  if (bearer && bearer.startsWith('Bearer ')) {
    return bearer.replace('Bearer ', '').trim();
  }

  return req.header('x-auth-token');
}

function auth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretgreenkey');
    req.user = decoded.user;
    return next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }

  return next();
}

module.exports = auth;
module.exports.adminOnly = adminOnly;
