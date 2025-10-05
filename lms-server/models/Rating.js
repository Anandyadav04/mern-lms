import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per course
ratingSchema.index({ user: 1, course: 1 }, { unique: true });

// Static method to get average rating
ratingSchema.statics.getAverageRating = async function(courseId) {
  const result = await this.aggregate([
    {
      $match: { course: courseId }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  try {
    await mongoose.model('Course').findByIdAndUpdate(courseId, {
      averageRating: result[0]?.averageRating || 0,
      totalRatings: result[0]?.totalRatings || 0
    });
  } catch (error) {
    console.error('Error updating course rating:', error);
  }
};

// Call getAverageRating after save
ratingSchema.post('save', function() {
  this.constructor.getAverageRating(this.course);
});

// Call getAverageRating after remove
ratingSchema.post('remove', function() {
  this.constructor.getAverageRating(this.course);
});

export default mongoose.model('Rating', ratingSchema);