/**
 * Thin data-access layer.
 *
 * `connectDB()` (config/db.js) decides whether Mongoose or the JSON file store
 * is used, and `init()` wraps either one in the same collection API:
 *
 *   coll.insert(doc)
 *   coll.find(filter, { sort, skip, limit })
 *   coll.findOne(filter)
 *   coll.findById(id)
 *   coll.updateById(id, patch)
 *   coll.deleteById(id)
 *   coll.deleteMany(filter)
 *   coll.count(filter)
 *
 * Route handlers only ever talk to `db.items`, `db.users`, ... so switching
 * databases never touches business logic.
 */
let collections = null;
let mode = 'json';

class MongoCollection {
  constructor(model) {
    this.model = model;
  }

  async insert(doc) {
    const created = await this.model.create(doc);
    return created.toObject();
  }

  async find(filter = {}, opts = {}) {
    let query = this.model.find(filter).lean();
    if (opts.sort) query = query.sort(opts.sort);
    if (opts.skip) query = query.skip(opts.skip);
    if (opts.limit) query = query.limit(opts.limit);
    return query.exec();
  }

  async findOne(filter = {}, opts = {}) {
    let query = this.model.findOne(filter).lean();
    if (opts.sort) query = query.sort(opts.sort);
    return query.exec();
  }

  async findById(id) {
    if (!id || !/^[a-f\d]{24}$/i.test(String(id))) return null;
    return this.model.findById(id).lean().exec();
  }

  async updateById(id, patch) {
    if (!id || !/^[a-f\d]{24}$/i.test(String(id))) return null;
    return this.model
      .findByIdAndUpdate(id, { ...patch, updatedAt: new Date() }, { new: true })
      .lean()
      .exec();
  }

  async deleteById(id) {
    if (!id || !/^[a-f\d]{24}$/i.test(String(id))) return null;
    return this.model.findByIdAndDelete(id).lean().exec();
  }

  async deleteMany(filter = {}) {
    const res = await this.model.deleteMany(filter);
    return res.deletedCount || 0;
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

/**
 * @param {{mode: string, models?: object, store?: object}} connection
 */
function init(connection) {
  mode = connection.mode;
  if (mode === 'mongodb') {
    const { models } = connection;
    collections = {
      users: new MongoCollection(models.user),
      items: new MongoCollection(models.item),
      claims: new MongoCollection(models.claim),
      notifications: new MongoCollection(models.notification),
      reports: new MongoCollection(models.report),
      contacts: new MongoCollection(models.contact),
    };
  } else {
    const { store } = connection;
    collections = {
      users: store.collection('users'),
      items: store.collection('items'),
      claims: store.collection('claims'),
      notifications: store.collection('notifications'),
      reports: store.collection('reports'),
      contacts: store.collection('contacts'),
    };
  }
  return module.exports;
}

function get(name) {
  if (!collections) throw new Error('Database not initialised. Call db.init() first.');
  return collections[name];
}

module.exports = {
  init,
  get mode() {
    return mode;
  },
  get users() {
    return get('users');
  },
  get items() {
    return get('items');
  },
  get claims() {
    return get('claims');
  },
  get notifications() {
    return get('notifications');
  },
  get reports() {
    return get('reports');
  },
  get contacts() {
    return get('contacts');
  },
};
