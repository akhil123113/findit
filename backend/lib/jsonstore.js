/**
 * JsonStore - a tiny persistent document store used when MongoDB is not
 * available. It implements the same small collection API as the Mongoose
 * wrapper in lib/db.js, so routes are written once and work with both.
 *
 * Data lives in a single JSON file and is written atomically (tmp + rename)
 * after every mutation. Perfectly fine for a college project demo; MongoDB is
 * used automatically in real deployments.
 */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const newId = () => crypto.randomBytes(12).toString('hex');

/* ------------------------------- query engine ------------------------------ */

function valueAt(doc, field) {
  if (!field.includes('.')) return doc[field];
  return field.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), doc);
}

function matchValue(actual, expected) {
  if (expected instanceof RegExp) {
    return typeof actual === 'string' && expected.test(actual);
  }
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    const ops = Object.keys(expected);
    const isOperatorObject = ops.every((op) => op.startsWith('$'));
    if (isOperatorObject) {
      return ops.every((op) => {
        const target = expected[op];
        switch (op) {
          case '$in':
            return (Array.isArray(target) ? target : []).some((v) => matchValue(actual, v));
          case '$nin':
            return !(Array.isArray(target) ? target : []).some((v) => matchValue(actual, v));
          case '$ne':
            return !matchValue(actual, target);
          case '$gte':
            return actual != null && actual >= target;
          case '$lte':
            return actual != null && actual <= target;
          case '$gt':
            return actual != null && actual > target;
          case '$lt':
            return actual != null && actual < target;
          case '$regex':
            return typeof actual === 'string' && new RegExp(target, expected.$options || 'i').test(actual);
          case '$exists':
            return target ? actual !== undefined : actual === undefined;
          default:
            return false;
        }
      });
    }
  }
  if (Array.isArray(actual)) return actual.some((v) => v === expected);
  return actual === expected;
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((sub) => matches(doc, sub));
    if (key === '$and') return expected.every((sub) => matches(doc, sub));
    return matchValue(valueAt(doc, key), expected);
  });
}

function sortDocs(docs, sort) {
  if (!sort) return docs;
  const entries = Object.entries(sort);
  return [...docs].sort((a, b) => {
    for (const [field, dir] of entries) {
      const av = valueAt(a, field);
      const bv = valueAt(b, field);
      if (av === bv) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av > bv ? 1 : -1;
      return dir < 0 ? -cmp : cmp;
    }
    return 0;
  });
}

/* -------------------------------- collection ------------------------------- */

class JsonCollection {
  constructor(store, name) {
    this.store = store;
    this.name = name;
  }

  get docs() {
    if (!this.store.data[this.name]) this.store.data[this.name] = [];
    return this.store.data[this.name];
  }

  async insert(doc) {
    const now = new Date().toISOString();
    const record = { _id: newId(), createdAt: now, updatedAt: now, ...doc };
    if (record.createdAt instanceof Date) record.createdAt = record.createdAt.toISOString();
    if (record.updatedAt instanceof Date) record.updatedAt = record.updatedAt.toISOString();
    this.docs.push(record);
    await this.store.save();
    return { ...record };
  }

  async find(filter = {}, opts = {}) {
    let out = this.docs.filter((doc) => matches(doc, filter)).map((doc) => ({ ...doc }));
    out = sortDocs(out, opts.sort);
    if (opts.skip) out = out.slice(opts.skip);
    if (opts.limit) out = out.slice(0, opts.limit);
    return out;
  }

  async findOne(filter = {}, opts = {}) {
    const [doc] = await this.find(filter, { ...opts, limit: 1 });
    return doc || null;
  }

  async findById(id) {
    if (!id) return null;
    return this.docs.find((doc) => String(doc._id) === String(id)) || null;
  }

  async updateById(id, patch) {
    const doc = this.docs.find((item) => String(item._id) === String(id));
    if (!doc) return null;
    for (const [key, value] of Object.entries(patch)) {
      doc[key] = value instanceof Date ? value.toISOString() : value;
    }
    doc.updatedAt = new Date().toISOString();
    await this.store.save();
    return { ...doc };
  }

  async deleteById(id) {
    const index = this.docs.findIndex((doc) => String(doc._id) === String(id));
    if (index === -1) return null;
    const [removed] = this.docs.splice(index, 1);
    await this.store.save();
    return removed;
  }

  async deleteMany(filter = {}) {
    const before = this.docs.length;
    this.store.data[this.name] = this.docs.filter((doc) => !matches(doc, filter));
    const removed = before - this.store.data[this.name].length;
    if (removed) await this.store.save();
    return removed;
  }

  async count(filter = {}) {
    return this.docs.filter((doc) => matches(doc, filter)).length;
  }
}

/* ---------------------------------- store --------------------------------- */

class JsonStore {
  constructor(file) {
    this.file = file;
    this.data = {};
    this.writeQueue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.data = JSON.parse(raw || '{}');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.data = {};
      await this.save();
    }
    return this;
  }

  collection(name) {
    return new JsonCollection(this, name);
  }

  /** Atomic write: dump to a temp file then rename over the real one. */
  save() {
    this.writeQueue = this.writeQueue.then(async () => {
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8');
      await fs.rename(tmp, this.file);
    });
    return this.writeQueue;
  }
}

module.exports = JsonStore;
module.exports.newId = newId;
