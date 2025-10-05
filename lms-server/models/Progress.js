import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  videoTimestamp: {
    type: Number,
    default: 0
  },
  quizScore: Number,
  quizAttempts: [{
    score: Number,
    answers: Object,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'paused'],
    default: 'in-progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  lessons: [lessonProgressSchema],
  totalTimeSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// In your Progress model, add these indexes
progressSchema.index({ userId: 1, lastAccessedAt: -1 });
progressSchema.index({ courseId: 1 });
progressSchema.index({ status: 1 });

// For faster lesson lookups within progress
progressSchema.index({ 'lessons.lessonId': 1 });

export default mongoose.model('Progress', progressSchema);