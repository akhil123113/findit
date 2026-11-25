const express = require('express');
const db = require('../lib/db');
const { asyncHandler, CATEGORIES } = require('../utils/helpers');

const router = express.Router();

/** Public website statistics used by the homepage counters. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [totalLost, totalFound, returned, active, pending, users, claims, resolvedClaims] =
      await Promise.all([
        db.items.count({ type: 'lost', status: { $in: ['active', 'returned'] } }),
        db.items.count({ type: 'found', status: { $in: ['active', 'returned'] } }),
        db.items.count({ status: 'returned' }),
        db.items.count({ status: 'active' }),
        db.items.count({ status: 'pending' }),
        db.users.count({}),
        db.claims.count({}),
        db.claims.count({ status: 'accepted' }),
      ]);

    const total = totalLost + totalFound;
    res.json({
      totalLost,
      totalFound,
      returned,
      active,
      pending,
      users,
      claims,
      resolvedClaims,
      total,
      successRate: total ? Math.round((returned / total) * 100) : 0,
      categories: CATEGORIES,
    });
  })
);

module.exports = router;
