/**
 * FindIt - Lost & Found Portal
 * Express server entry point.
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const db = require('./lib/db');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

/* ------------------------------- middleware ------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false, // the frontend loads its own CSS/JS files
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

/* --------------------------------- routes --------------------------------- */
app.use('/api', apiLimiter, optionalAuth);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', database: db.mode, time: new Date().toISOString() })
);

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

/* ------------------------------ static files ------------------------------ */
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use(express.static(FRONTEND_DIR, { extensions: ['html'] }));

// pretty URLs: /browse -> browse.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || path.extname(req.path)) return next();
  const candidate = path.join(FRONTEND_DIR, `${req.path.replace(/^\/+/, '')}.html`);
  if (fs.existsSync(candidate)) return res.sendFile(candidate);
  return res.status(404).sendFile(path.join(FRONTEND_DIR, '404.html'));
});

/* ----------------------------- error handling ----------------------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors)[0]?.message || 'Invalid data.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That record already exists.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
  return res.status(err.status || 500).json({
    error: err.status ? err.message : 'Something went wrong on our side. Please try again.',
  });
});

/* --------------------------------- startup -------------------------------- */
(async () => {
  try {
    const connection = await connectDB();
    db.init(connection);

    if (String(process.env.SEED_ON_EMPTY || 'true') === 'true') {
      const users = await db.users.count({});
      if (users === 0) {
        const { seedDatabase } = require('./utils/seedData');
        const result = await seedDatabase();
        if (!result.skipped) {
          console.log('[seed] demo data created (admin@findit.edu / Admin@123)');
        }
      }
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('  FindIt - Lost & Found Portal');
      console.log(`  Server   : http://localhost:${PORT}`);
      console.log(`  Database : ${db.mode === 'mongodb' ? 'MongoDB' : 'local JSON file store'}`);
      console.log(`  Mode     : ${process.env.NODE_ENV || 'development'}`);
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start the server:', err);
    process.exit(1);
  }
})();

module.exports = app;
