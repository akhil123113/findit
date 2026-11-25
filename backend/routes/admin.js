const express = require('express');
const db = require('../lib/db');
const { asyncHandler, publicItem, publicUser, clean, escapeRegex } = require('../utils/helpers');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { notify } = require('../utils/notify');
const { removeUpload } = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth, requireAdmin);

/* -------------------------------- overview -------------------------------- */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [items, lost, found, active, returned, pending, users, blocked, claims, openClaims, openReports, newMessages] =
      await Promise.all([
        db.items.count({}),
        db.items.count({ type: 'lost' }),
        db.items.count({ type: 'found' }),
        db.items.count({ status: 'active' }),
        db.items.count({ status: 'returned' }),
        db.items.count({ status: 'pending' }),
        db.users.count({}),
        db.users.count({ status: 'blocked' }),
        db.claims.count({}),
        db.claims.count({ status: 'pending' }),
        db.reports.count({ status: 'open' }),
        db.contacts.count({ status: 'new' }),
      ]);

    res.json({
      items,
      lost,
      found,
      active,
      returned,
      pending,
      users,
      blocked,
      claims,
      openClaims,
      openReports,
      newMessages,
      successRate: items ? Math.round((returned / items) * 100) : 0,
      dbMode: db.mode,
    });
  })
);

/* ---------------------------------- items --------------------------------- */
router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['pending', 'active', 'returned', 'rejected', 'removed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (['lost', 'found'].includes(req.query.type)) filter.type = req.query.type;
    const q = clean(req.query.q, 60);
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { location: rx }, { ownerName: rx }];
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const [items, total] = await Promise.all([
      db.items.find(filter, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit }),
      db.items.count(filter),
    ]);

    res.json({
      items: items.map((item) => publicItem(item, req.user)),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  })
);

/* --------------------------- approve / reject a post ---------------------- */
router.patch(
  '/items/:id/status',
  asyncHandler(async (req, res) => {
    const status = clean(req.body.status, 20);
    const allowed = ['pending', 'active', 'returned', 'rejected', 'removed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const updated = await db.items.updateById(item._id, {
      status,
      adminNote: clean(req.body.adminNote, 300),
      ...(status === 'returned' ? { returnedAt: new Date().toISOString() } : {}),
    });

    const messages = {
      active: 'approved and is now visible on the portal',
      rejected: 'rejected. Please make sure reports are genuine',
      removed: 'removed by an administrator',
      returned: 'marked as returned',
      pending: 'moved back to the pending queue',
    };
    await notify(item.owner, {
      title: `Your report "${item.title}" was ${status}`,
      message: `An administrator ${messages[status] || status}.`,
      link: `/item.html?id=${item._id}`,
      type: status === 'active' ? 'success' : 'warning',
    });

    return res.json({ item: publicItem(updated, req.user), message: `Item ${status}.` });
  })
);

router.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    await db.items.deleteById(item._id);
    await db.claims.deleteMany({ item: String(item._id) });
    await db.reports.deleteMany({ item: String(item._id) });
    removeUpload(item.imageUrl);
    return res.json({ message: 'Listing removed permanently.' });
  })
);

/* ---------------------------------- users --------------------------------- */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['student', 'staff', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    if (['active', 'blocked'].includes(req.query.status)) filter.status = req.query.status;
    const q = clean(req.query.q, 60);
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { studentId: rx }, { department: rx }];
    }

    const users = await db.users.find(filter, { sort: { createdAt: -1 }, limit: 200 });
    const enriched = await Promise.all(
      users.map(async (user) => {
        const reports = await db.items.count({ owner: String(user._id) });
        return { ...publicUser(user), reports };
      })
    );
    res.json({ users: enriched });
  })
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await db.users.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const patch = {};
    if (['student', 'staff', 'admin'].includes(req.body.role)) patch.role = req.body.role;
    if (['active', 'blocked'].includes(req.body.status)) patch.status = req.body.status;
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });

    if (String(user._id) === String(req.user._id) && patch.role && patch.role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own admin role.' });
    }

    const updated = await db.users.updateById(user._id, patch);
    return res.json({ user: publicUser(updated), message: 'User updated.' });
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await db.users.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own account here.' });
    }

    const admins = await db.users.count({ role: 'admin' });
    if (user.role === 'admin' && admins <= 1) {
      return res.status(400).json({ error: 'At least one administrator must remain.' });
    }

    await db.items.deleteMany({ owner: String(user._id) });
    await db.claims.deleteMany({ $or: [{ claimantId: String(user._id) }, { ownerId: String(user._id) }] });
    await db.notifications.deleteMany({ user: String(user._id) });
    await db.users.deleteById(user._id);

    return res.json({ message: 'User and their reports were deleted.' });
  })
);

/* ---------------------------------- claims -------------------------------- */
router.get(
  '/claims',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['pending', 'accepted', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
    const claims = await db.claims.find(filter, { sort: { createdAt: -1 }, limit: 200 });
    res.json({
      claims: claims.map((claim) => ({
        id: String(claim._id),
        itemId: claim.item,
        itemTitle: claim.itemTitle,
        itemType: claim.itemType,
        claimantName: claim.claimantName,
        claimantEmail: claim.claimantEmail,
        message: claim.message,
        proof: claim.proof,
        status: claim.status,
        createdAt: claim.createdAt,
      })),
    });
  })
);

/* -------------------------------- reports --------------------------------- */
router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['open', 'resolved'].includes(req.query.status)) filter.status = req.query.status;
    const reports = await db.reports.find(filter, { sort: { createdAt: -1 }, limit: 200 });
    res.json({
      reports: reports.map((report) => ({
        id: String(report._id),
        itemId: report.item,
        itemTitle: report.itemTitle,
        reporterName: report.reporterName,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt,
      })),
    });
  })
);

router.patch(
  '/reports/:id',
  asyncHandler(async (req, res) => {
    const report = await db.reports.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    const status = req.body.status === 'open' ? 'open' : 'resolved';
    const updated = await db.reports.updateById(report._id, { status });
    return res.json({ message: `Flag marked as ${status}.`, report: { id: String(updated._id), status } });
  })
);

/* -------------------------------- messages -------------------------------- */
router.get(
  '/messages',
  asyncHandler(async (_req, res) => {
    const messages = await db.contacts.find({}, { sort: { createdAt: -1 }, limit: 200 });
    res.json({
      messages: messages.map((m) => ({
        id: String(m._id),
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        status: m.status,
        createdAt: m.createdAt,
      })),
    });
  })
);

router.patch(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const message = await db.contacts.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found.' });
    await db.contacts.updateById(message._id, { status: 'read' });
    return res.json({ message: 'Marked as read.' });
  })
);

module.exports = router;
