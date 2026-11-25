const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    itemTitle: { type: String, default: '' },
    itemImage: { type: String, default: '' },
    itemType: { type: String, default: 'found' },
    ownerId: { type: String, required: true }, // person who reported the item
    claimantId: { type: String, required: true },
    claimantName: { type: String, default: '' },
    claimantEmail: { type: String, default: '' },
    claimantPhone: { type: String, default: '' },
    message: { type: String, required: true },
    proof: { type: String, required: true }, // proof of ownership description
    proofImage: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    decisionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ claimantId: 1 });

module.exports = mongoose.model('Claim', claimSchema);
