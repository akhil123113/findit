const { CATEGORIES, clean } = require('./helpers');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[+]?[\d\s\-()]{6,18}$/;

const isEmail = (value) => EMAIL_RE.test(String(value || '').trim());

function validateRegister(body) {
  const errors = [];
  const name = clean(body.name, 60);
  const email = clean(body.email, 120).toLowerCase();
  const password = String(body.password || '');
  const confirm = String(body.confirmPassword || body.password || '');

  if (name.length < 2) errors.push('Full name must be at least 2 characters.');
  if (!isEmail(email)) errors.push('Please enter a valid email address.');
  if (password.length < 6) errors.push('Password must be at least 6 characters long.');
  if (password !== confirm) errors.push('Passwords do not match.');
  if (body.phone && !PHONE_RE.test(body.phone)) errors.push('Please enter a valid phone number.');

  return { errors, value: { name, email, password } };
}

function validateLogin(body) {
  const errors = [];
  const email = clean(body.email, 120).toLowerCase();
  const password = String(body.password || '');
  if (!isEmail(email)) errors.push('Please enter a valid email address.');
  if (!password) errors.push('Password is required.');
  return { errors, value: { email, password } };
}

function validateItem(body, forcedType) {
  const errors = [];
  const type = forcedType || clean(body.type, 10).toLowerCase();
  const title = clean(body.title, 90);
  const category = clean(body.category, 30);
  const description = clean(body.description, 1500);
  const location = clean(body.location, 120);
  const contactEmail = clean(body.contactEmail, 120).toLowerCase();
  const contactPhone = clean(body.contactPhone, 20);

  if (!['lost', 'found'].includes(type)) errors.push('Item type must be "lost" or "found".');
  if (title.length < 3) errors.push('Item name must be at least 3 characters.');
  if (!CATEGORIES.includes(category)) errors.push('Please choose a valid category.');
  if (description.length < 10) errors.push('Description must be at least 10 characters.');
  if (location.length < 2) errors.push('Please tell us where the item was lost or found.');
  if (!isEmail(contactEmail)) errors.push('Please enter a valid contact email.');
  if (contactPhone && !PHONE_RE.test(contactPhone)) errors.push('Please enter a valid contact phone.');

  const rawDate = clean(body.dateLostFound, 40);
  let dateLostFound = null;
  if (!rawDate) {
    errors.push('Please select the date the item was lost or found.');
  } else {
    dateLostFound = new Date(rawDate);
    if (Number.isNaN(dateLostFound.getTime())) {
      errors.push('Please select a valid date.');
      dateLostFound = null;
    } else {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (dateLostFound > endOfToday) errors.push('The date cannot be in the future.');
    }
  }

  return {
    errors,
    value: {
      type,
      title,
      category,
      description,
      location,
      contactEmail,
      contactPhone,
      dateLostFound,
    },
  };
}

function validateClaim(body) {
  const errors = [];
  const message = clean(body.message, 1000);
  const proof = clean(body.proof, 1000);
  if (message.length < 10) errors.push('Please write a short message (at least 10 characters).');
  if (proof.length < 10) errors.push('Proof of ownership must be at least 10 characters.');
  return { errors, value: { message, proof } };
}

function validateContact(body) {
  const errors = [];
  const name = clean(body.name, 60);
  const email = clean(body.email, 120).toLowerCase();
  const subject = clean(body.subject, 120);
  const message = clean(body.message, 2000);
  if (name.length < 2) errors.push('Please enter your name.');
  if (!isEmail(email)) errors.push('Please enter a valid email address.');
  if (subject.length < 3) errors.push('Please add a subject.');
  if (message.length < 10) errors.push('Message must be at least 10 characters.');
  return { errors, value: { name, email, subject, message } };
}

module.exports = {
  isEmail,
  clean,
  validateRegister,
  validateLogin,
  validateItem,
  validateClaim,
  validateContact,
};
