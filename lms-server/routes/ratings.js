import express from 'express';
import Course from '../models/Course.js';
import {authorize as auth} from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/courses/:courseId/ratings
// @desc    Submit or update rating for a course
// @access  Private
router.post('/:courseId/ratings', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const courseId = req.params.courseId;
    const userId = req.user.id;

    console.log('📝 Rating submission received:', { courseId, userId, rating, review });

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating is required and must be between 1 and 5' 
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled in the course
    const isEnrolled = course.studentsEnrolled && course.studentsEnrolled.includes(userId);
    if (!isEnrolled) {
      return res.status(403).json({ 
        message: 'You must be enrolled in the course to rate it' 
      });
    }

    // Check if user has already rated this course
    const existingRatingIndex = course.ratings.findIndex(
      r => r.user && r.user.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      course.ratings[existingRatingIndex].rating = rating;
      course.ratings[existingRatingIndex].review = review || '';
      course.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      course.ratings.push({
        user: userId,
        rating,
        review: review || ''
      });
    }

    // Update average rating
    if (typeof course.updateAverageRating === 'function') {
      course.updateAverageRating();
    } else {
      // Fallback calculation
      const totalRatings = course.ratings.length;
      const sum = course.ratings.reduce((acc, r) => acc + r.rating, 0);
      course.averageRating = totalRatings > 0 ? Number((sum / totalRatings).toFixed(1)) : 0;
      course.totalRatings = totalRatings;
    }

    await course.save();

    // Populate the user data for response
    await course.populate('ratings.user', 'name email');

    const userRating = course.ratings.find(r => r.user && r.user._id.toString() === userId);

    console.log('✅ Rating submitted successfully');

    res.json({
      message: existingRatingIndex !== -1 ? 'Rating updated successfully' : 'Rating submitted successfully',
      data: userRating
    });

  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:courseId/ratings
// @desc    Get all ratings for a course
// @access  Public
router.get('/:courseId/ratings', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const course = await Course.findById(courseId)
      .populate('ratings.user', 'name email')
      .select('ratings averageRating totalRatings');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Sort ratings by creation date (newest first) and paginate
    const sortedRatings = course.ratings.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const paginatedRatings = sortedRatings.slice(skip, skip + limit);

    // Add isCurrentUser flag to each rating
    const ratingsWithUserFlag = paginatedRatings.map(rating => ({
      ...rating.toObject(),
      isCurrentUser: req.user ? rating.user._id.toString() === req.user.id : false
    }));

    res.json({
      data: ratingsWithUserFlag,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(course.ratings.length / limit),
        totalRatings: course.ratings.length,
        hasNext: page < Math.ceil(course.ratings.length / limit),
        hasPrev: page > 1
      },
      averageRating: course.averageRating || 0,
      totalRatings: course.totalRatings || 0
    });

  } catch (error) {
    console.error('❌ Error fetching ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:courseId/ratings/stats
// @desc    Get rating statistics for a course
// @access  Public
router.get('/:courseId/ratings/stats', async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId).select('ratings averageRating totalRatings');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    course.ratings.forEach(rating => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        distribution[rating.rating]++;
      }
    });

    res.json({
      averageRating: course.averageRating || 0,
      totalRatings: course.totalRatings || 0,
      ratingDistribution: distribution
    });

  } catch (error) {
    console.error('❌ Error fetching rating stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:courseId/ratings
// @desc    Delete user's rating for a course
// @access  Private
router.delete('/:courseId/ratings', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find and remove the user's rating
    const ratingIndex = course.ratings.findIndex(
      r => r.user && r.user.toString() === userId
    );

    if (ratingIndex === -1) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    course.ratings.splice(ratingIndex, 1);
    
    // Update average rating
    if (typeof course.updateAverageRating === 'function') {
      course.updateAverageRating();
    } else {
      // Fallback calculation
      const totalRatings = course.ratings.length;
      const sum = course.ratings.reduce((acc, r) => acc + r.rating, 0);
      course.averageRating = totalRatings > 0 ? Number((sum / totalRatings).toFixed(1)) : 0;
      course.totalRatings = totalRatings;
    }
    
    await course.save();

    res.json({ message: 'Rating deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:courseId/my-rating
// @desc    Get current user's rating for a course
// @access  Private
router.get('/:courseId/my-rating', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await Course.findById(courseId)
      .populate('ratings.user', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const userRating = course.ratings.find(
      r => r.user && r.user._id.toString() === userId
    );

    if (!userRating) {
      return res.status(404).json({ message: 'No rating found' });
    }

    res.json({
      data: userRating
    });

  } catch (error) {
    console.error('❌ Error fetching user rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;