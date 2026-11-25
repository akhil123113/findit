const express = require('express');
const db = require('../lib/db');
const { asyncHandler, clean } = require('../utils/helpers');
const { validateClaim } = require('../utils/validate');
const { requireAuth } = require('../middleware/auth');
const { singleImage, publicUrl, removeUpload } = require('../middleware/upload');
const { notify } = require('../utils/notify');

const router = express.Router();

function publicClaim(claim, item) {
  return {
    id: String(claim._id),
    itemId: claim.item,
    itemTitle: claim.itemTitle,
    itemImage: claim.itemImage || (item ? item.imageUrl : ''),
    itemType: claim.itemType,
    claimantId: claim.claimantId,
    claimantName: claim.claimantName,
    claimantEmail: claim.claimantEmail,
    claimantPhone: claim.claimantPhone,
    message: claim.message,
    proof: claim.proof,
    proofImage: claim.proofImage || '',
    status: claim.status,
    decisionNote: claim.decisionNote || '',
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
  };
}

/* --------------------------------- create --------------------------------- */
router.post(
  '/',
  requireAuth,
  singleImage('proofImage'),
  asyncHandler(async (req, res) => {
    const itemId = clean(req.body.itemId, 40);
    const item = await db.items.findById(itemId);
    if (!item) {
      removeUpload(publicUrl(req.file));
      return res.status(404).json({ error: 'Item not found.' });
    }
    if (String(item.owner) === String(req.user._id)) {
      removeUpload(publicUrl(req.file));
      return res.status(400).json({ error: 'You cannot claim an item you reported yourself.' });
    }
    if (item.status !== 'active') {
      removeUpload(publicUrl(req.file));
      return res.status(400).json({ error: 'This item is no longer open for claims.' });
    }

    const { errors, value } = validateClaim(req.body);
    if (errors.length) {
      removeUpload(publicUrl(req.file));
      return res.status(400).json({ error: errors[0], errors });
    }

    const existing = await db.claims.findOne({
      item: String(item._id),
      claimantId: String(req.user._id),
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      removeUpload(publicUrl(req.file));
      return res.status(409).json({ error: 'You already have an open claim on this item.' });
    }

    const claim = await db.claims.insert({
      item: String(item._id),
      itemTitle: item.title,
      itemImage: item.imageUrl || '',
      itemType: item.type,
      ownerId: String(item.owner),
      claimantId: String(req.user._id),
      claimantName: req.user.name,
      claimantEmail: req.user.email,
      claimantPhone: req.user.phone || '',
      message: value.message,
      proof: value.proof,
      proofImage: publicUrl(req.file),
      status: 'pending',
      decisionNote: '',
    });

    await notify(item.owner, {
      title: `New claim on "${item.title}"`,
      message: `${req.user.name} submitted proof of ownership. Review the claim in your dashboard.`,
      link: '/dashboard.html#received',
      type: 'claim',
    });

    return res.status(201).json({
      claim: publicClaim(claim),
      message: 'Claim submitted! The finder will review your proof of ownership.',
    });
  })
);

/* ------------------------------- my claims -------------------------------- */
router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const claims = await db.claims.find(
      { claimantId: String(req.user._id) },
      { sort: { createdAt: -1 } }
    );
    res.json({ claims: claims.map((claim) => publicClaim(claim)) });
  })
);

/* -------------------------- claims on my reports -------------------------- */
router.get(
  '/received',
  requireAuth,
  asyncHandler(async (req, res) => {
    const claims = await db.claims.find(
      { ownerId: String(req.user._id) },
      { sort: { createdAt: -1 } }
    );
    res.json({ claims: claims.map((claim) => publicClaim(claim)) });
  })
);

/* --------------------------------- decide --------------------------------- */
async function decide(req, res, decision) {
  const claim = await db.claims.findById(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const isOwner = String(claim.ownerId) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the person who reported the item can decide on claims.' });
  }
  if (claim.status !== 'pending') {
    return res.status(400).json({ error: `This claim was already ${claim.status}.` });
  }

  const note = clean(req.body.note, 400);
  const updated = await db.claims.updateById(claim._id, {
    status: decision,
    decisionNote: note,
  });

  const item = await db.items.findById(claim.item);

  if (decision === 'accepted') {
    // the item is returned to the claimant: close it and reject other claims
    if (item) {
      await db.items.updateById(item._id, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
        returnedTo: claim.claimantName,
      });
    }
    const others = await db.claims.find({
      item: claim.item,
      status: 'pending',
      claimantId: { $ne: claim.claimantId },
    });
    await Promise.all(
      others.map(async (other) => {
        await db.claims.updateById(other._id, {
          status: 'rejected',
          decisionNote: 'Another claimant provided valid proof of ownership.',
        });
        await notify(other.claimantId, {
          title: `Claim update for "${other.itemTitle}"`,
          message: 'Another claimant provided valid proof, so this claim was closed.',
          link: `/item.html?id=${other.item}`,
          type: 'claim',
        });
      })
    );
    await notify(claim.claimantId, {
      title: `Your claim for "${claim.itemTitle}" was accepted`,
      message: note || 'The reporter confirmed your proof of ownership. Coordinate the hand-over.',
      link: `/item.html?id=${claim.item}`,
      type: 'success',
    });
  } else {
    await notify(claim.claimantId, {
      title: `Your claim for "${claim.itemTitle}" was declined`,
      message: note || 'The reporter could not verify your proof of ownership.',
      link: `/item.html?id=${claim.item}`,
      type: 'warning',
    });
  }

  return res.json({
    claim: publicClaim(updated),
    message:
      decision === 'accepted'
        ? 'Claim accepted. The item is now marked as returned.'
        : 'Claim rejected. The claimant has been notified.',
  });
}

router.patch(
  '/:id/accept',
  requireAuth,
  asyncHandler((req, res) => decide(req, res, 'accepted'))
);

router.patch(
  '/:id/reject',
  requireAuth,
  asyncHandler((req, res) => decide(req, res, 'rejected'))
);

/* -------------------------------- withdraw -------------------------------- */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const claim = await db.claims.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });
    if (String(claim.claimantId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only withdraw your own claims.' });
    }
    if (claim.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending claims can be withdrawn.' });
    }
    await db.claims.deleteById(claim._id);
    return res.json({ message: 'Claim withdrawn.' });
  })
);

module.exports = router;
