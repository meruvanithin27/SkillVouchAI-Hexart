import mongoose from '../db.js';

const feedbackSchema = new mongoose.Schema({
  _id: { type: String },
  requestId: { type: String, required: true, ref: 'ExchangeRequest' },
  fromUserId: { type: String, required: true, ref: 'User' },
  toUserId: { type: String, required: true, ref: 'User' },
  stars: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Number, required: true }
}, { 
  timestamps: false,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

feedbackSchema.index({ requestId: 1, fromUserId: 1 }, { unique: true });

export const ExchangeFeedback = mongoose.model('ExchangeFeedback', feedbackSchema);
export default ExchangeFeedback;
