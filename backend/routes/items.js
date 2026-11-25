const express = require('express');
const db = require('../lib/db');
const { asyncHandler, publicItem, escapeRegex, CATEGORIES } = require('../utils/helpers');
const { validateItem, clean } = require('../utils/validate');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { singleImage, publicUrl, removeUpload } = require('../middleware/upload');
const { notify, notifyAdmins } = require('../utils/notify');

const router = express.Router();

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  date: { dateLostFound: -1 },
  views: { views: -1 },
};

/** Builds the Mongo-style filter from the query string. */
function buildFilter(query, viewer) {
  const filter = {};
  const and = [];

  // ---- visibility ----
  if (query.mine === '1' || query.mine === 'true') {
    if (!viewer) return { error: 'Login required to view your own reports.' };
    filter.owner = String(viewer._id);
    if (query.status && query.status !== 'all') filter.status = query.status;
  } else if (viewer && viewer.role === 'admin' && query.status && query.status !== 'all') {
    filter.status = query.status;
  } else if (viewer && viewer.role === 'admin' && query.status === 'all') {
    // no status filter
  } else {
    filter.status = 'active';
  }

  // ---- type: lost / found ----
  if (['lost', 'found'].includes(query.type)) filter.type = query.type;

  // ---- category ----
  if (query.category && CATEGORIES.includes(query.category)) filter.category = query.category;

  // ---- free text search (name, description, location) ----
  const q = clean(query.q || query.search, 80);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    and.push({ $or: [{ title: rx }, { description: rx }, { location: rx }, { category: rx }] });
  }

  // ---- location ----
  const location = clean(query.location, 80);
  if (location) {
    and.push({ location: new RegExp(escapeRegex(location), 'i') });
  }

  // ---- date range on the lost/found date ----
  const from = clean(query.from, 30);
  const to = clean(query.to, 30);
  const dateFilter = {};
  if (from && !Number.isNaN(new Date(from).getTime())) {
    dateFilter.$gte = new Date(from).toISOString();
  }
  if (to && !Number.isNaN(new Date(to).getTime())) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end.toISOString();
  }
  if (Object.keys(dateFilter).length) and.push({ dateLostFound: dateFilter });

  if (and.length) filter.$and = and;
  return { filter };
}

/* --------------------------------- recent --------------------------------- */
router.get(
  '/recent',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 6, 12);
    const [lost, found] = await Promise.all([
      db.items.find({ status: 'active', type: 'lost' }, { sort: { createdAt: -1 }, limit }),
      db.items.find({ status: 'active', type: 'found' }, { sort: { createdAt: -1 }, limit }),
    ]);
    res.json({
      lost: lost.map((item) => publicItem(item, req.user)),
      found: found.map((item) => publicItem(item, req.user)),
    });
  })
);

/* ------------------------------ categories -------------------------------- */
router.get('/categories', (_req, res) => res.json({ categories: CATEGORIES }));

/* ---------------------------------- list ---------------------------------- */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { filter, error } = buildFilter(req.query, req.user);
    if (error) return res.status(401).json({ error });

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
    const sort = SORTS[req.query.sort] || SORTS.newest;

    const [items, total] = await Promise.all([
      db.items.find(filter, { sort, skip: (page - 1) * limit, limit }),
      db.items.count(filter),
    ]);

    res.json({
      items: items.map((item) => publicItem(item, req.user)),
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  })
);

/* --------------------------------- detail --------------------------------- */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const isOwner = req.user && String(req.user._id) === String(item.owner);
    const isAdmin = req.user && req.user.role === 'admin';
    const publiclyVisible = item.status === 'active' || item.status === 'returned';
    if (!publiclyVisible && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'This listing is no longer available.' });
    }

    await db.items.updateById(item._id, { views: (item.views || 0) + 1 });
    const fresh = { ...item, views: (item.views || 0) + 1 };

    let myClaim = null;
    if (req.user) {
      myClaim = await db.claims.findOne({ item: String(item._id), claimantId: String(req.user._id) });
    }

    return res.json({
      item: publicItem(fresh, req.user),
      myClaim: myClaim
        ? {
            id: String(myClaim._id),
            status: myClaim.status,
            createdAt: myClaim.createdAt,
            decisionNote: myClaim.decisionNote || '',
          }
        : null,
    });
  })
);

/* --------------------------------- create --------------------------------- */
router.post(
  '/',
  requireAuth,
  singleImage('image'),
  asyncHandler(async (req, res) => {
    const { errors, value } = validateItem(req.body);
    if (errors.length) {
      removeUpload(publicUrl(req.file));
      return res.status(400).json({ error: errors[0], errors });
    }

    const autoApprove = String(process.env.AUTO_APPROVE_ITEMS || 'true') === 'true';

    const item = await db.items.insert({
      ...value,
      dateLostFound: value.dateLostFound.toISOString(),
      imageUrl: publicUrl(req.file),
      owner: String(req.user._id),
      ownerName: req.user.name,
      ownerEmail: req.user.email,
      ownerPhone: req.user.phone || value.contactPhone,
      status: autoApprove ? 'active' : 'pending',
      views: 0,
      adminNote: '',
      returnedTo: '',
      returnedAt: null,
      reportsCount: 0,
    });

    if (!autoApprove) {
      await notifyAdmins({
        title: 'New item awaiting approval',
        message: `${req.user.name} reported a ${value.type} item: "${value.title}".`,
        link: '/admin.html#pending',
      });
    }

    return res.status(201).json({
      item: publicItem(item, req.user),
      message: autoApprove
        ? 'Your report is live. We hope it finds its way home!'
        : 'Report submitted. An administrator will review it shortly.',
    });
  })
);

/* --------------------------------- update --------------------------------- */
router.patch(
  '/:id',
  requireAuth,
  singleImage('image'),
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const isOwner = String(req.user._id) === String(item.owner);
    if (!isOwner && req.user.role !== 'admin') {
      removeUpload(publicUrl(req.file));
      return res.status(403).json({ error: 'You can only edit your own reports.' });
    }

    const merged = {
      ...item,
      ...req.body,
      type: item.type,
      dateLostFound: req.body.dateLostFound || item.dateLostFound,
    };
    const { errors, value } = validateItem(merged, item.type);
    if (errors.length) {
      removeUpload(publicUrl(req.file));
      return res.status(400).json({ error: errors[0], errors });
    }

    const patch = { ...value, dateLostFound: value.dateLostFound.toISOString() };
    if (req.file) {
      patch.imageUrl = publicUrl(req.file);
      removeUpload(item.imageUrl);
    }
    if (req.user.role === 'admin' && req.body.status) patch.status = req.body.status;

    const updated = await db.items.updateById(item._id, patch);
    return res.json({ item: publicItem(updated, req.user), message: 'Report updated.' });
  })
);

/* --------------------------------- delete --------------------------------- */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const isOwner = String(req.user._id) === String(item.owner);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own reports.' });
    }

    await db.items.deleteById(item._id);
    await db.claims.deleteMany({ item: String(item._id) });
    await db.reports.deleteMany({ item: String(item._id) });
    removeUpload(item.imageUrl);

    return res.json({ message: 'Report deleted.' });
  })
);

/* ----------------------------- mark as returned --------------------------- */
router.patch(
  '/:id/returned',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const isOwner = String(req.user._id) === String(item.owner);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the person who reported this item can close it.' });
    }
    if (item.status === 'returned') {
      return res.status(400).json({ error: 'This item is already marked as returned.' });
    }

    const updated = await db.items.updateById(item._id, {
      status: 'returned',
      returnedAt: new Date().toISOString(),
      returnedTo: clean(req.body.returnedTo, 80) || item.returnedTo || '',
    });

    return res.json({ item: publicItem(updated, req.user), message: 'Marked as returned. Nice!' });
  })
);

/* --------------------------- contact the reporter ------------------------- */
router.post(
  '/:id/contact',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const message = clean(req.body.message, 600);
    await notify(item.owner, {
      title: `${req.user.name} wants to contact you about "${item.title}"`,
      message: message || 'Someone is interested in your report.',
      link: `/item.html?id=${item._id}`,
      type: 'contact',
    });

    return res.json({
      message: 'Contact details unlocked. The reporter has been notified.',
      contact: {
        email: item.contactEmail,
        phone: item.contactPhone,
        name: item.ownerName,
      },
    });
  })
);

/* ------------------------- report a suspicious listing -------------------- */
router.post(
  '/:id/report',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const item = await db.items.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const reason = clean(req.body.reason, 120);
    if (!reason) return res.status(400).json({ error: 'Please choose a reason for the report.' });

    await db.reports.insert({
      item: String(item._id),
      itemTitle: item.title,
      reporterId: req.user ? String(req.user._id) : '',
      reporterName: req.user ? req.user.name : 'Guest',
      reason,
      details: clean(req.body.details, 500),
      status: 'open',
    });

    await db.items.updateById(item._id, { reportsCount: (item.reportsCount || 0) + 1 });
    await notifyAdmins({
      title: 'Listing reported',
      message: `"${item.title}" was reported: ${reason}`,
      link: '/admin.html#reports',
    });

    return res.status(201).json({ message: 'Thanks for flagging this. Our team will review it.' });
  })
);

module.exports = router;
