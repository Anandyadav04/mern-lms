import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'free'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate enrollments
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);