import mongoose from '../db.js';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  codeSnippet: { type: String, required: true },
  options: [{ type: String }],
  correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  _id: { type: String },
  skillName: { type: String, required: true },
  questions: [questionSchema],
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

export const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
