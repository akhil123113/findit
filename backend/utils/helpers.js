/** Shared helpers used across routes. */

/** Wraps an async route so rejected promises reach the error handler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const CATEGORIES = [
  'Electronics',
  'Books',
  'ID Cards',
  'Wallets',
  'Keys',
  'Bags',
  'Accessories',
  'Other',
];

/** Escapes user input before it goes into a RegExp search. */
const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Trims a value and caps its length (defensive input handling). */
const clean = (value, max = 500) => String(value == null ? '' : value).trim().slice(0, max);

/** Public shape of a user document (never leaks the password hash). */
function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    studentId: user.studentId || '',
    department: user.department || '',
    status: user.status,
    createdAt: user.createdAt,
  };
}

/** a***@gmail.com - shown to guests so contact details stay private. */
function maskEmail(email = '') {
  const [name, domain] = String(email).split('@');
  if (!domain) return '***';
  const visible = name.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(name.length - 1, 2))}@${domain}`;
}

function maskPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
}

/** Contact block, masked for guests (privacy protection). */
function contactFor(item, viewer) {
  const isOwner = viewer && String(viewer._id) === String(item.owner);
  const isAdmin = viewer && viewer.role === 'admin';
  if (isOwner || isAdmin) {
    return {
      revealed: true,
      email: item.contactEmail,
      phone: item.contactPhone,
      ownerName: item.ownerName,
    };
  }
  if (viewer) {
    return {
      revealed: true,
      email: item.contactEmail,
      phone: item.contactPhone,
      ownerName: item.ownerName,
    };
  }
  return {
    revealed: false,
    email: maskEmail(item.contactEmail),
    phone: item.contactPhone ? maskPhone(item.contactPhone) : '',
    ownerName: item.ownerName ? `${item.ownerName.split(' ')[0]} (verified user)` : 'Registered user',
  };
}

/** Serialises an item for the API. */
function publicItem(item, viewer) {
  if (!item) return null;
  const isOwner = viewer && String(viewer._id) === String(item.owner);
  return {
    id: String(item._id),
    title: item.title,
    type: item.type,
    category: item.category,
    description: item.description,
    dateLostFound: item.dateLostFound,
    location: item.location,
    imageUrl: item.imageUrl || '',
    status: item.status,
    views: item.views || 0,
    contact: contactFor(item, viewer),
    ownerId: item.owner,
    ownerName: item.ownerName,
    isOwner: Boolean(isOwner),
    returnedTo: item.returnedTo || '',
    returnedAt: item.returnedAt || null,
    adminNote: viewer && viewer.role === 'admin' ? item.adminNote : undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

module.exports = {
  asyncHandler,
  ApiError,
  CATEGORIES,
  escapeRegex,
  clean,
  publicUser,
  publicItem,
  maskEmail,
  maskPhone,
  contactFor,
};
