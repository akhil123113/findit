const mongoose = require('mongoose');

const CATEGORIES = ['Electronics', 'Books', 'ID Cards', 'Wallets', 'Keys', 'Bags', 'Accessories', 'Other'];

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['lost', 'found'], required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true },
    dateLostFound: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, default: '' },
    owner: { type: String, required: true }, // user id (kept as a plain id: works with both drivers)
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    ownerPhone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'active', 'returned', 'rejected', 'removed'],
      default: 'active',
    },
    views: { type: Number, default: 0 },
    adminNote: { type: String, default: '' },
    returnedTo: { type: String, default: '' },
    returnedAt: { type: Date, default: null },
    reportsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

itemSchema.index({ title: 'text', description: 'text', location: 'text' });
itemSchema.index({ status: 1, type: 1, category: 1, dateLostFound: -1 });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
