const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `item-${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED[file.mimetype]) {
    return cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'));
  }
  return cb(null, true);
}

const maxMb = Number(process.env.MAX_UPLOAD_MB || 5);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 },
});

/** Wraps multer so its errors become clean 400 responses. */
function singleImage(field = 'image') {
  const handler = upload.single(field);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Image is too large. Maximum size is ${maxMb} MB.`
            : err.message;
        return res.status(400).json({ error: message });
      }
      return res.status(400).json({ error: err.message || 'Image upload failed.' });
    });
  };
}

/** Turns an uploaded file into a public URL path. */
function publicUrl(file) {
  return file ? `/uploads/${file.filename}` : '';
}

/** Deletes a previously uploaded file (ignores seed images and remote URLs). */
function removeUpload(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/') || urlPath.startsWith('/uploads/seed/')) return;
  const file = path.join(UPLOAD_DIR, path.basename(urlPath));
  fs.promises.unlink(file).catch(() => {});
}

module.exports = { upload, singleImage, publicUrl, removeUpload, UPLOAD_DIR };
