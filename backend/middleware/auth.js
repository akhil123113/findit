const jwt = require('jsonwebtoken');
const db = require('../lib/db');

const COOKIE_NAME = 'findit_token';

function secret() {
  return process.env.JWT_SECRET || 'findit-dev-secret-change-me';
}

function expiresInDays() {
  return Number(process.env.JWT_EXPIRES_DAYS || 7);
}

function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email },
    secret(),
    { expiresIn: `${expiresInDays()}d` }
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiresInDays() * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

function readToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return null;
}

/** Attaches req.user when a valid token is present, never blocks. */
async function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, secret());
    const user = await db.users.findById(payload.sub);
    if (user && user.status === 'active') {
      req.user = user;
      req.token = payload;
    }
  } catch (_err) {
    /* invalid / expired token -> treated as a guest */
  }
  return next();
}

/** Blocks the request unless a valid session exists. */
async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    const payload = jwt.verify(token, secret());
    const user = await db.users.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Your session is no longer valid.' });
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'This account has been blocked by an administrator.' });
    }
    req.user = user;
    req.token = payload;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Session expired, please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access only.' });
  }
  return next();
}

module.exports = {
  COOKIE_NAME,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  optionalAuth,
  requireAuth,
  requireAdmin,
};
