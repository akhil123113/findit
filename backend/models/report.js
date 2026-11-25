const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    itemTitle: { type: String, default: '' },
    reporterId: { type: String, default: '' },
    reporterName: { type: String, default: 'Guest' },
    reason: { type: String, required: true },
    details: { type: String, default: '' },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
