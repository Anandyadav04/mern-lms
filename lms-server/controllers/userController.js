import User from '../models/User.js';
import Course from '../models/Course.js';

// Get user progress for a course
export const getCourseProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const enrolledCourse = user.enrolledCourses.find(
      enrolled => enrolled.course.toString() === req.params.courseId
    );
    
    if (!enrolledCourse) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    res.status(200).json({
      success: true,
      progress: enrolledCourse.progress,
      completedLessons: enrolledCourse.completedLessons
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's enrolled courses
export const getEnrolledCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'enrolledCourses.course',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      });
    
    res.status(200).json({
      success: true,
      count: user.enrolledCourses.length,
      data: user.enrolledCourses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};