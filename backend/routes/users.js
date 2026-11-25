const express = require('express');
const db = require('../lib/db');
const { asyncHandler, publicUser, clean } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* ------------------------------- my profile ------------------------------- */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = String(req.user._id);
    const [lostCount, foundCount, returnedCount, pendingClaims, myClaims] = await Promise.all([
      db.items.count({ owner: userId, type: 'lost' }),
      db.items.count({ owner: userId, type: 'found' }),
      db.items.count({ owner: userId, status: 'returned' }),
      db.claims.count({ ownerId: userId, status: 'pending' }),
      db.claims.count({ claimantId: userId }),
    ]);

    res.json({
      user: publicUser(req.user),
      stats: { lostCount, foundCount, returnedCount, pendingClaims, myClaims },
    });
  })
);

/* ------------------------------ update profile ---------------------------- */
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const patch = {};
    if (req.body.name !== undefined) {
      const name = clean(req.body.name, 60);
      if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      patch.name = name;
    }
    if (req.body.phone !== undefined) patch.phone = clean(req.body.phone, 20);
    if (req.body.studentId !== undefined) patch.studentId = clean(req.body.studentId, 30);
    if (req.body.department !== undefined) patch.department = clean(req.body.department, 60);

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    const updated = await db.users.updateById(req.user._id, patch);

    // keep denormalised names in sync on existing items
    if (patch.name) {
      const items = await db.items.find({ owner: String(req.user._id) });
      await Promise.all(
        items.map((item) => db.items.updateById(item._id, { ownerName: patch.name }))
      );
    }

    return res.json({ user: publicUser(updated), message: 'Profile updated.' });
  })
);

/* ---------------------------- my reported items --------------------------- */
router.get(
  '/me/items',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filter = { owner: String(req.user._id) };
    if (['lost', 'found'].includes(req.query.type)) filter.type = req.query.type;

    const items = await db.items.find(filter, { sort: { createdAt: -1 } });
    const { publicItem } = require('../utils/helpers');

    // attach claim counts so the dashboard can show "3 claims"
    const withCounts = await Promise.all(
      items.map(async (item) => {
        const claimsCount = await db.claims.count({ item: String(item._id) });
        const pendingCount = await db.claims.count({ item: String(item._id), status: 'pending' });
        return { ...publicItem(item, req.user), claimsCount, pendingCount };
      })
    );

    res.json({ items: withCounts });
  })
);

module.exports = router;
