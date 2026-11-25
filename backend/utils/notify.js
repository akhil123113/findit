const db = require('../lib/db');

/**
 * Creates an in-app notification for one user.
 * Never throws: a failed notification must not break the main action.
 */
async function notify(userId, { title, message = '', link = '', type = 'info' }) {
  if (!userId) return null;
  try {
    return await db.notifications.insert({
      user: String(userId),
      title,
      message,
      link,
      type,
      read: false,
    });
  } catch (err) {
    console.warn('[notify] failed:', err.message);
    return null;
  }
}

/** Sends the same notification to every administrator. */
async function notifyAdmins({ title, message = '', link = '/admin.html', type = 'admin' }) {
  try {
    const admins = await db.users.find({ role: 'admin' });
    await Promise.all(admins.map((admin) => notify(admin._id, { title, message, link, type })));
  } catch (err) {
    console.warn('[notify] admin broadcast failed:', err.message);
  }
}

module.exports = { notify, notifyAdmins };
