const express = require('express');
const db = require('../lib/db');
const { asyncHandler } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicNotification(n) {
  return {
    id: String(n._id),
    title: n.title,
    message: n.message,
    link: n.link,
    type: n.type,
    read: Boolean(n.read),
    createdAt: n.createdAt,
  };
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = String(req.user._id);
    const [items, unread] = await Promise.all([
      db.notifications.find({ user: userId }, { sort: { createdAt: -1 }, limit: 40 }),
      db.notifications.count({ user: userId, read: false }),
    ]);
    res.json({ notifications: items.map(publicNotification), unread });
  })
);

router.patch(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await db.notifications.find({ user: String(req.user._id), read: false });
    await Promise.all(items.map((n) => db.notifications.updateById(n._id, { read: true })));
    res.json({ message: 'All notifications marked as read.', updated: items.length });
  })
);

router.patch(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await db.notifications.findById(req.params.id);
    if (!notification || String(notification.user) !== String(req.user._id)) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    await db.notifications.updateById(notification._id, { read: true });
    return res.json({ message: 'Marked as read.' });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await db.notifications.findById(req.params.id);
    if (!notification || String(notification.user) !== String(req.user._id)) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    await db.notifications.deleteById(notification._id);
    return res.json({ message: 'Notification removed.' });
  })
);

module.exports = router;
