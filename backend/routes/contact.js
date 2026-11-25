const express = require('express');
const db = require('../lib/db');
const { asyncHandler } = require('../utils/helpers');
const { validateContact } = require('../utils/validate');
const { notifyAdmins } = require('../utils/notify');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { errors, value } = validateContact(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], errors });

    await db.contacts.insert({ ...value, status: 'new' });
    await notifyAdmins({
      title: 'New contact message',
      message: `${value.name}: ${value.subject}`,
      link: '/admin.html#messages',
    });

    return res.status(201).json({
      message: 'Thanks for reaching out! The FindIt team will reply by email soon.',
    });
  })
);

module.exports = router;
