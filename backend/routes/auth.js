const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { asyncHandler, publicUser } = require('../utils/helpers');
const { validateRegister, validateLogin, isEmail, clean } = require('../utils/validate');
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const firstName = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const titles = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'ms.', 'ms', 'mrs.', 'mrs'];
  if (!parts.length) return 'there';
  if (parts.length > 1 && titles.includes(parts[0].toLowerCase())) return parts[1];
  return parts[0];
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/* -------------------------------- register -------------------------------- */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { errors, value } = validateRegister(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], errors });

    const existing = await db.users.findOne({ email: value.email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const requestedRole = clean(req.body.role, 20).toLowerCase();
    const role = adminEmails().includes(value.email)
      ? 'admin'
      : requestedRole === 'staff'
        ? 'staff'
        : 'student';

    const user = await db.users.insert({
      name: value.name,
      email: value.email,
      passwordHash: await bcrypt.hash(value.password, 10),
      role,
      phone: clean(req.body.phone, 20),
      studentId: clean(req.body.studentId, 30),
      department: clean(req.body.department, 60),
      status: 'active',
      resetTokenHash: null,
      resetTokenExpires: null,
    });

    setAuthCookie(res, signToken(user));
    await notify(user._id, {
      title: 'Welcome to FindIt!',
      message: 'Report a lost or found item to get started.',
      link: '/report.html?type=lost',
      type: 'success',
    });

    return res.status(201).json({ user: publicUser(user), message: 'Account created successfully.' });
  })
);

/* --------------------------------- login ---------------------------------- */
async function loginHandler(req, res, adminOnly) {
  const { errors, value } = validateLogin(req.body);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  const user = await db.users.findOne({ email: value.email });
  if (!user) return res.status(401).json({ error: 'Incorrect email or password.' });
  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'This account has been blocked. Contact the administrator.' });
  }

  const ok = await bcrypt.compare(value.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });

  if (adminOnly && user.role !== 'admin') {
    return res.status(403).json({ error: 'This login is for administrators only.' });
  }

  setAuthCookie(res, signToken(user));
  return res.json({ user: publicUser(user), message: `Welcome back, ${firstName(user.name)}!` });
}

router.post('/login', asyncHandler((req, res) => loginHandler(req, res, false)));
router.post('/admin/login', asyncHandler((req, res) => loginHandler(req, res, true)));

/* --------------------------------- logout --------------------------------- */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'You have been logged out.' });
});

/* ----------------------------------- me ----------------------------------- */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // optionalAuth already ran; a missing user simply means "guest".
    if (!req.user) return res.json({ user: null });
    const unread = await db.notifications.count({ user: String(req.user._id), read: false });
    return res.json({ user: publicUser(req.user), unreadNotifications: unread, dbMode: db.mode });
  })
);

/* ----------------------------- forgot password ---------------------------- */
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const email = clean(req.body.email, 120).toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

    const user = await db.users.findOne({ email });
    const genericMessage =
      'If an account exists for that email, a password reset link has been sent.';

    if (!user) return res.json({ message: genericMessage });

    const token = crypto.randomBytes(32).toString('hex');
    await db.users.updateById(user._id, {
      resetTokenHash: hashToken(token),
      resetTokenExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

    const resetUrl = `${req.protocol}://${req.get('host')}/forgot-password.html?token=${token}`;
    console.log(`[auth] password reset link for ${email}: ${resetUrl}`);

    // No mail server is configured in this project, so in development the link
    // is returned in the response and printed in the terminal.
    const payload = { message: genericMessage };
    if (process.env.NODE_ENV !== 'production') {
      payload.devResetUrl = resetUrl;
      payload.devToken = token;
    }
    return res.json(payload);
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const token = clean(req.body.token, 200);
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirmPassword || req.body.password || '');

    if (!token) return res.status(400).json({ error: 'Reset token is missing.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (password !== confirm) return res.status(400).json({ error: 'Passwords do not match.' });

    const user = await db.users.findOne({ resetTokenHash: hashToken(token) });
    if (!user) return res.status(400).json({ error: 'This reset link is invalid.' });
    if (!user.resetTokenExpires || new Date(user.resetTokenExpires).getTime() < Date.now()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    await db.users.updateById(user._id, {
      passwordHash: await bcrypt.hash(password, 10),
      resetTokenHash: null,
      resetTokenExpires: null,
    });

    return res.json({ message: 'Password updated. You can now log in.' });
  })
);

/* ------------------------------ change password --------------------------- */
router.patch(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const current = String(req.body.currentPassword || '');
    const next = String(req.body.newPassword || '');
    if (next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const ok = await bcrypt.compare(current, req.user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Your current password is incorrect.' });

    await db.users.updateById(req.user._id, { passwordHash: await bcrypt.hash(next, 10) });
    return res.json({ message: 'Password changed successfully.' });
  })
);

module.exports = router;
