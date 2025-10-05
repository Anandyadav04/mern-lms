// models/Lesson.js
import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  lessonType: {
    type: String,
    required: true,
    enum: ['video', 'article', 'quiz'],
    default: 'video'
  },
  videoUrl: {
    type: String,
    trim: true,
    // Make it optional - remove required: true
  },
  articleContent: {
    type: String,
    trim: true
  },
  quizQuestions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      type: String,
      required: true,
      trim: true
    }],
    correctAnswer: {
      type: Number,
      required: true,
      min: 0
    },
    points: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    }
  }],
  resources: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'link', 'file'],
      default: 'link'
    }
  }],
  isPreview: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create unique compound index to prevent duplicate order in same course
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

export default mongoose.model('Lesson', lessonSchema);