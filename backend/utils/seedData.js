/**
 * Demo data for FindIt.
 * Used by `npm run seed` and automatically on first boot when the database
 * is empty and SEED_ON_EMPTY=true.
 */
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 30, 0, 0);
  return d.toISOString();
};

const USERS = [
  {
    key: 'admin',
    name: 'Dr. Meera Rao',
    email: 'admin@findit.edu',
    password: 'Admin@123',
    role: 'admin',
    phone: '+91 98450 11223',
    department: 'Student Affairs',
    studentId: 'ADM-001',
  },
  {
    key: 'akhil',
    name: 'Akhil Pudota',
    email: 'akhil@findit.edu',
    password: 'Student@123',
    role: 'student',
    phone: '+91 98765 43210',
    department: 'Computer Science',
    studentId: 'CS21B045',
  },
  {
    key: 'priya',
    name: 'Priya Nair',
    email: 'priya@findit.edu',
    password: 'Student@123',
    role: 'student',
    phone: '+91 90123 45678',
    department: 'Electronics',
    studentId: 'EC21B012',
  },
  {
    key: 'rahul',
    name: 'Rahul Verma',
    email: 'rahul@findit.edu',
    password: 'Student@123',
    role: 'student',
    phone: '+91 99887 76655',
    department: 'Mechanical',
    studentId: 'ME20B088',
  },
  {
    key: 'staff',
    name: 'Suresh Kumar',
    email: 'librarian@findit.edu',
    password: 'Staff@123',
    role: 'staff',
    phone: '+91 91234 56780',
    department: 'Central Library',
    studentId: 'LIB-204',
  },
];

const ITEMS = [
  {
    key: 'laptop',
    title: 'Dell Inspiron 15 Laptop',
    type: 'lost',
    category: 'Electronics',
    description:
      'Silver Dell Inspiron 15 laptop in a black sleeve. Has a blue ISRO sticker on the lid and a cracked corner near the hinge. Contains my final year project files.',
    location: 'Computer Science Block, Lab 3',
    days: 2,
    image: '/uploads/seed/laptop.jpg',
    owner: 'akhil',
    status: 'active',
    views: 42,
  },
  {
    key: 'idcard',
    title: 'Student ID Card - Priya Nair',
    type: 'found',
    category: 'ID Cards',
    description:
      'Found a student ID card near the canteen counter. Name on the card is Priya Nair, Electronics department. Card has a small scratch on the photo.',
    location: 'Main Canteen, near the billing counter',
    days: 1,
    image: '/uploads/seed/idcard.jpg',
    owner: 'rahul',
    status: 'active',
    views: 31,
  },
  {
    key: 'wallet',
    title: 'Brown Leather Wallet',
    type: 'lost',
    category: 'Wallets',
    description:
      'Brown leather wallet with a driving licence, two ATM cards and about ₹800 cash inside. Lost somewhere between the library and the bus stop.',
    location: 'Central Library to Main Gate',
    days: 4,
    image: '/uploads/seed/wallet.jpg',
    owner: 'priya',
    status: 'active',
    views: 57,
  },
  {
    key: 'keys',
    title: 'Bunch of Hostel Room Keys',
    type: 'found',
    category: 'Keys',
    description:
      'Found a key ring with three keys and a small red Ganesha keychain near the basketball court. Kept safely with the hostel warden office.',
    location: 'Basketball Court, Hostel Block C',
    days: 3,
    image: '/uploads/seed/keys.jpg',
    owner: 'staff',
    status: 'active',
    views: 24,
  },
  {
    key: 'bag',
    title: 'Blue Wildcraft Backpack',
    type: 'lost',
    category: 'Bags',
    description:
      'Navy blue Wildcraft backpack with a broken left strap and a maths tutorial notebook inside. Also has a water bottle in the side pocket.',
    location: 'Auditorium, second row seating',
    days: 5,
    image: '/uploads/seed/bag.jpg',
    owner: 'akhil',
    status: 'active',
    views: 19,
  },
  {
    key: 'headphones',
    title: 'Boat Rockerz Bluetooth Headphones',
    type: 'found',
    category: 'Electronics',
    description:
      'Black Boat Rockerz neckband earphones found on a chair in the reading room. It still has charge and pairs with my phone, so it can be verified.',
    location: 'Central Library, Reading Room 2',
    days: 2,
    image: '/uploads/seed/headphones.jpg',
    owner: 'rahul',
    status: 'active',
    views: 38,
  },
  {
    key: 'book',
    title: 'Data Structures Textbook (Cormen)',
    type: 'found',
    category: 'Books',
    description:
      'Introduction to Algorithms by Cormen, third edition. Name "Sneha" is written on the inside cover in pencil. Found in the CS department reading area.',
    location: 'CS Department Reading Area',
    days: 6,
    image: '/uploads/seed/book.jpg',
    owner: 'staff',
    status: 'active',
    views: 15,
  },
  {
    key: 'watch',
    title: 'Titan Analog Wrist Watch',
    type: 'lost',
    category: 'Accessories',
    description:
      'Silver Titan analog watch with a leather strap. Gift from my father, so it matters a lot. Last seen after the sports day practice.',
    location: 'Sports Ground, near the long jump pit',
    days: 7,
    image: '/uploads/seed/watch.jpg',
    owner: 'priya',
    status: 'returned',
    views: 66,
  },
  {
    key: 'calculator',
    title: 'Casio FX-991 Scientific Calculator',
    type: 'found',
    category: 'Other',
    description:
      'Casio FX-991ES Plus calculator found on the third floor bench of the exam hall. Has a small sticker of a football on the back.',
    location: 'Exam Hall, Third Floor',
    days: 1,
    image: '/uploads/seed/calculator.jpg',
    owner: 'rahul',
    status: 'active',
    views: 12,
  },
  {
    key: 'glasses',
    title: 'Black Rimmed Spectacles',
    type: 'found',
    category: 'Accessories',
    description:
      'Black frame spectacles in a soft blue case, found in the campus shuttle bus. Please describe the prescription to claim.',
    location: 'Campus Shuttle Bus, Route 2',
    days: 2,
    image: '/uploads/seed/glasses.jpg',
    owner: 'staff',
    status: 'active',
    views: 9,
  },
  {
    key: 'bottle',
    title: 'Steel Water Bottle with Stickers',
    type: 'lost',
    category: 'Other',
    description:
      'Stainless steel Milton bottle with three stickers on it (one ISRO, one cricket team). Left behind after the morning lecture.',
    location: 'Lecture Hall 4, Mechanical Block',
    days: 3,
    image: '/uploads/seed/bottle.jpg',
    owner: 'akhil',
    status: 'active',
    views: 8,
  },
  {
    key: 'umbrella',
    title: 'Black Folding Umbrella',
    type: 'found',
    category: 'Other',
    description:
      'Black automatic folding umbrella found near the security cabin after the rain. Handle has a small chip. Currently with the security desk.',
    location: 'Main Gate Security Cabin',
    days: 1,
    image: '/uploads/seed/umbrella.jpg',
    owner: 'staff',
    status: 'pending',
    views: 3,
  },
];

async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await Promise.all([
      db.users.deleteMany({}),
      db.items.deleteMany({}),
      db.claims.deleteMany({}),
      db.notifications.deleteMany({}),
      db.reports.deleteMany({}),
      db.contacts.deleteMany({}),
    ]);
  }

  const existing = await db.users.count({});
  if (existing > 0 && !reset) {
    return { skipped: true, reason: 'database is not empty' };
  }

  /* ------------------------------- users -------------------------------- */
  const users = {};
  for (const seedUser of USERS) {
    const created = await db.users.insert({
      name: seedUser.name,
      email: seedUser.email,
      passwordHash: await bcrypt.hash(seedUser.password, 10),
      role: seedUser.role,
      phone: seedUser.phone,
      studentId: seedUser.studentId,
      department: seedUser.department,
      status: 'active',
      resetTokenHash: null,
      resetTokenExpires: null,
      createdAt: daysAgo(20),
    });
    users[seedUser.key] = created;
  }

  /* ------------------------------- items -------------------------------- */
  const items = {};
  for (const seedItem of ITEMS) {
    const owner = users[seedItem.owner];
    const created = await db.items.insert({
      title: seedItem.title,
      type: seedItem.type,
      category: seedItem.category,
      description: seedItem.description,
      dateLostFound: daysAgo(seedItem.days),
      location: seedItem.location,
      imageUrl: seedItem.image,
      contactEmail: owner.email,
      contactPhone: owner.phone,
      owner: String(owner._id),
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
      status: seedItem.status,
      views: seedItem.views,
      adminNote: '',
      returnedTo: seedItem.status === 'returned' ? 'Akhil Pudota' : '',
      returnedAt: seedItem.status === 'returned' ? daysAgo(2) : null,
      reportsCount: 0,
      createdAt: daysAgo(seedItem.days - 0.5 > 0 ? seedItem.days - 0.5 : 0.2),
    });
    items[seedItem.key] = created;
  }

  /* ------------------------------- claims ------------------------------- */
  const returnedItem = items.watch;
  await db.claims.insert({
    item: String(returnedItem._id),
    itemTitle: returnedItem.title,
    itemImage: returnedItem.imageUrl,
    itemType: returnedItem.type,
    ownerId: String(returnedItem.owner),
    claimantId: String(users.akhil._id),
    claimantName: users.akhil.name,
    claimantEmail: users.akhil.email,
    claimantPhone: users.akhil.phone,
    message: 'I think this is the watch I lost at the sports ground last week.',
    proof:
      'The watch has "AP" engraved on the back of the case and the leather strap is stitched in brown. I can show the purchase bill.',
    proofImage: '',
    status: 'accepted',
    decisionNote: 'Verified the engraving. Handed over at the student affairs office.',
    createdAt: daysAgo(3),
  });

  const pendingClaim = await db.claims.insert({
    item: String(items.idcard._id),
    itemTitle: items.idcard.title,
    itemImage: items.idcard.imageUrl,
    itemType: items.idcard.type,
    ownerId: String(items.idcard.owner),
    claimantId: String(users.priya._id),
    claimantName: users.priya.name,
    claimantEmail: users.priya.email,
    claimantPhone: users.priya.phone,
    message: 'That is my ID card, I lost it at the canteen on Tuesday.',
    proof:
      'The card number is EC21B012 and the photo has my name printed on it. I can show my fee receipt as proof.',
    proofImage: '',
    status: 'pending',
    decisionNote: '',
    createdAt: daysAgo(1),
  });

  /* --------------------------- notifications ---------------------------- */
  await db.notifications.insert({
    user: String(users.rahul._id),
    title: 'New claim on "Student ID Card - Priya Nair"',
    message: 'Priya Nair submitted proof of ownership. Review the claim in your dashboard.',
    link: '/dashboard.html#received',
    type: 'claim',
    read: false,
    createdAt: daysAgo(1),
  });
  await db.notifications.insert({
    user: String(users.priya._id),
    title: 'Your claim is pending review',
    message: 'Rahul Verma will review your proof of ownership shortly.',
    link: `/item.html?id=${items.idcard._id}`,
    type: 'info',
    read: false,
    createdAt: daysAgo(1),
  });
  await db.notifications.insert({
    user: String(users.akhil._id),
    title: 'Your claim for "Titan Analog Wrist Watch" was accepted',
    message: 'The reporter confirmed your proof of ownership. Coordinate the hand-over.',
    link: `/item.html?id=${returnedItem._id}`,
    type: 'success',
    read: false,
    createdAt: daysAgo(2),
  });
  await db.notifications.insert({
    user: String(users.admin._id),
    title: 'New item awaiting approval',
    message: 'Suresh Kumar reported a found item: "Black Folding Umbrella".',
    link: '/admin.html#pending',
    type: 'admin',
    read: false,
    createdAt: daysAgo(1),
  });

  /* ------------------------------ reports ------------------------------- */
  await db.reports.insert({
    item: String(items.glasses._id),
    itemTitle: items.glasses.title,
    reporterId: String(users.priya._id),
    reporterName: users.priya.name,
    reason: 'Wrong category',
    details: 'This looks like it was posted twice with a different title.',
    status: 'open',
    createdAt: daysAgo(1),
  });

  return {
    skipped: false,
    users: Object.keys(users).length,
    items: Object.keys(items).length,
    claims: 2,
    pendingClaim: String(pendingClaim._id),
  };
}

module.exports = { seedDatabase, USERS, ITEMS };
