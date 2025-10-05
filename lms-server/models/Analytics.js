// models/Analytics.js
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  enrollments: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  averageCompletionRate: {
    type: Number,
    default: 0
  },
  averageTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  studentActivity: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timeSpent: Number,
    lessonsCompleted: Number,
    lastActivity: Date
  }]
}, {
  timestamps: true
});

export default mongoose.model('Analytics', analyticsSchema);