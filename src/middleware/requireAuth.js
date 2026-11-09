// GIVEN — do not modify.
// Checks the Bearer token and sets req.user = { id, role }.
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../config');

module.exports = function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
  }
  try {
    const payload = jwt.verify(match[1], ACCESS_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
  }
};
