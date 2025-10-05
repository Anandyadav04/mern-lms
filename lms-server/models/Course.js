// models/Course.js
import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  videoUrl: String,
  duration: Number, // in minutes
  order: Number,
  isPreview: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: String
  },
  imageUrl: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // NEW: Enhanced student progress tracking
  studentProgress: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedLessons: [{
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: Number // in minutes
    }],
    progress: {
      type: Number,
      default: 0, // percentage
      min: 0,
      max: 100
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0
    },
    quizScores: [{
      quizId: mongoose.Schema.Types.ObjectId,
      score: Number,
      totalQuestions: Number,
      attemptedAt: Date
    }]
  }],
  lessons: [lessonSchema],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update average rating when new rating is added
courseSchema.methods.updateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  this.averageRating = Number((sum / this.ratings.length).toFixed(1));
  this.totalRatings = this.ratings.length;
};

// NEW: Update student progress
courseSchema.methods.updateStudentProgress = function(studentId, lessonId, timeSpent = 0) {
  const progressIndex = this.studentProgress.findIndex(
    progress => progress.student.toString() === studentId.toString()
  );
  
  if (progressIndex === -1) {
    // First time accessing the course
    this.studentProgress.push({
      student: studentId,
      completedLessons: [{
        lessonId: lessonId,
        completedAt: new Date(),
        timeSpent: timeSpent
      }],
      progress: this.lessons.length > 0 ? (1 / this.lessons.length) * 100 : 0,
      lastAccessed: new Date(),
      totalTimeSpent: timeSpent
    });
  } else {
    // Update existing progress
    const studentProgress = this.studentProgress[progressIndex];
    
    // Check if lesson already completed
    const lessonIndex = studentProgress.completedLessons.findIndex(
      lesson => lesson.lessonId.toString() === lessonId.toString()
    );
    
    if (lessonIndex === -1) {
      studentProgress.completedLessons.push({
        lessonId: lessonId,
        completedAt: new Date(),
        timeSpent: timeSpent
      });
    } else {
      studentProgress.completedLessons[lessonIndex].timeSpent += timeSpent;
    }
    
    // Update progress percentage
    studentProgress.progress = this.lessons.length > 0 ? 
      (studentProgress.completedLessons.length / this.lessons.length) * 100 : 0;
    
    studentProgress.lastAccessed = new Date();
    studentProgress.totalTimeSpent += timeSpent;
  }
};

// Pre-save middleware to update average rating
courseSchema.pre('save', function(next) {
  if (this.isModified('ratings')) {
    this.updateAverageRating();
  }
  next();
});

export default mongoose.model('Course', courseSchema);