import mongoose from '../db.js';

const quizAttemptSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, required: true, ref: 'User' },
  quizId: { type: String, required: true, ref: 'Quiz' },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  completedAt: { type: Number, required: true }
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

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
