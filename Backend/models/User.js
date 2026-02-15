import mongoose from '../db.js';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, default: 'Beginner' },
  verified: { type: Boolean, default: false },
  experienceYears: { type: Number, default: 0 },
  availability: [{ type: String }]
}, { _id: false });

const userSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, required: true },
  bio: { type: String, default: '' },
  discordLink: { type: String },
  skillsKnown: { type: [skillSchema], default: [] },
  skillsToLearn: { type: [skillSchema], default: [] },
  rating: { type: Number, default: 0 },
  learningHours: { type: Number, default: 0 },
  weeklyActivity: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const User = mongoose.model('User', userSchema);
export default User;
