/**
 * Database connection.
 *
 * Two drivers are supported, both expose the exact same collection API so the
 * route handlers never have to know which one is active:
 *
 *   1. MongoDB  - used whenever MONGODB_URI is set and reachable (Mongoose).
 *   2. FileStore - a JSON file based fallback (backend/data/db.json) that lets
 *                  the project run with zero setup, e.g. for a quick demo.
 */
const path = require('path');
const mongoose = require('mongoose');
const JsonStore = require('../lib/jsonstore');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const modelFiles = ['user', 'item', 'claim', 'notification', 'report', 'contact'];

async function connectDB() {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (uri) {
    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log(`[db] connected to MongoDB -> ${mongoose.connection.name}`);
      return { mode: 'mongodb', models: requireModels() };
    } catch (err) {
      console.warn(`[db] MongoDB unavailable (${err.message}).`);
      console.warn('[db] Falling back to the local JSON file store.');
    }
  } else {
    console.log('[db] MONGODB_URI not set - using the local JSON file store.');
  }

  const store = new JsonStore(DB_FILE);
  await store.init();
  console.log(`[db] file store ready -> ${DB_FILE}`);
  return { mode: 'json', store };
}

function requireModels() {
  const models = {};
  for (const name of modelFiles) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    models[name] = require(`../models/${name}`);
  }
  return models;
}

module.exports = { connectDB, DB_FILE };
