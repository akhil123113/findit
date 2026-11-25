/**
 * Seeds the database with demo users, items, claims and notifications.
 *
 *   npm run seed          -> seed only if the database is empty
 *   npm run seed:reset    -> wipe everything and seed again
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { connectDB } = require('../config/db');
const db = require('../lib/db');
const { seedDatabase } = require('../utils/seedData');

(async () => {
  const reset = process.argv.includes('--reset');
  try {
    const connection = await connectDB();
    db.init(connection);
    console.log(`[seed] driver: ${connection.mode}`);

    const result = await seedDatabase({ reset });
    if (result.skipped) {
      console.log(`[seed] skipped - ${result.reason}. Use "npm run seed:reset" to force.`);
    } else {
      console.log(`[seed] done: ${result.users} users, ${result.items} items, ${result.claims} claims.`);
      console.log('');
      console.log('  Admin   : admin@findit.edu     / Admin@123');
      console.log('  Student : akhil@findit.edu     / Student@123');
      console.log('  Student : priya@findit.edu     / Student@123');
      console.log('  Staff   : librarian@findit.edu / Staff@123');
    }
    process.exit(0);
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exit(1);
  }
})();
