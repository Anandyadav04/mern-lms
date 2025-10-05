// controllers/analyticsController.js
import Course from '../models/Course.js';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';

// Get course analytics for instructor
export const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user._id;

    const course = await Course.findById(courseId)
      .populate('studentProgress.student', 'name email')
      .populate('studentsEnrolled', 'name email createdAt');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the instructor of this course'
      });
    }

    // Calculate analytics
    const totalStudents = course.studentsEnrolled.length;
    const completedStudents = course.studentProgress.filter(
      progress => progress.progress === 100
    ).length;

    const averageCompletionRate = totalStudents > 0 ? 
      (course.studentProgress.reduce((acc, progress) => acc + progress.progress, 0) / totalStudents) : 0;

    const averageTimeSpent = totalStudents > 0 ?
      (course.studentProgress.reduce((acc, progress) => acc + progress.totalTimeSpent, 0) / totalStudents) : 0;

    // Get recent student activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeStudents = course.studentProgress.filter(
      progress => progress.lastAccessed >= sevenDaysAgo
    ).length;

    // Calculate revenue (if you have payment system)
    const totalRevenue = course.price * totalStudents;

    // Lesson completion statistics
    const lessonCompletionStats = course.lessons.map(lesson => {
      const completedCount = course.studentProgress.filter(progress =>
        progress.completedLessons.some(completed => 
          completed.lessonId.toString() === lesson._id.toString()
        )
      ).length;
      
      return {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        completionRate: totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0,
        completedCount
      };
    });

    res.json({
      success: true,
      data: {
        courseId: course._id,
        courseTitle: course.title,
        totalStudents,
        completedStudents,
        activeStudents,
        averageCompletionRate: Math.round(averageCompletionRate),
        averageTimeSpent: Math.round(averageTimeSpent),
        totalRevenue,
        lessonCompletionStats,
        studentProgress: course.studentProgress.slice(0, 10), // Recent 10 students
        enrollmentTrend: await getEnrollmentTrend(courseId)
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Get all student progress for instructor
export const getStudentProgress = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Get all courses by this instructor
    const courses = await Course.find({ instructor: instructorId })
      .populate('studentProgress.student', 'name email')
      .select('title studentProgress');

    // Flatten student progress across all courses
    const allStudentProgress = courses.flatMap(course => 
      course.studentProgress.map(progress => ({
        ...progress.toObject(),
        courseTitle: course.title,
        courseId: course._id
      }))
    );

    // Sort by last activity (most recent first)
    allStudentProgress.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));

    res.json({
      success: true,
      data: allStudentProgress
    });

  } catch (error) {
    console.error('Student progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress',
      error: error.message
    });
  }
};

// Get instructor dashboard overview
export const getInstructorOverview = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId })
      .populate('studentsEnrolled')
      .populate('studentProgress.student');

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, course) => acc + course.studentsEnrolled.length, 0);
    const totalRevenue = courses.reduce((acc, course) => 
      acc + (course.price * course.studentsEnrolled.length), 0
    );

    // Calculate active students (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeStudents = courses.reduce((acc, course) => 
      acc + course.studentProgress.filter(progress => 
        progress.lastAccessed >= thirtyDaysAgo
      ).length, 0
    );

    // Course performance
    const coursePerformance = courses.map(course => {
      const enrolled = course.studentsEnrolled.length;
      const completed = course.studentProgress.filter(p => p.progress === 100).length;
      const completionRate = enrolled > 0 ? (completed / enrolled) * 100 : 0;

      return {
        courseId: course._id,
        title: course.title,
        enrolled,
        completed,
        completionRate: Math.round(completionRate),
        revenue: course.price * enrolled,
        averageRating: course.averageRating
      };
    });

    res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        activeStudents,
        totalRevenue,
        coursePerformance,
        recentEnrollments: await getRecentEnrollments(instructorId)
      }
    });

  } catch (error) {
    console.error('Instructor overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor overview',
      error: error.message
    });
  }
};

// Helper functions
async function getEnrollmentTrend(courseId) {
  // Implementation for enrollment trend over time
  // This would typically aggregate data from your analytics collection
  return [];
}

async function getRecentEnrollments(instructorId) {
  const courses = await Course.find({ instructor: instructorId })
    .populate('studentsEnrolled', 'name email createdAt')
    .select('title studentsEnrolled');

  const recentEnrollments = courses.flatMap(course =>
    course.studentsEnrolled.map(student => ({
      studentName: student.name,
      studentEmail: student.email,
      courseTitle: course.title,
      enrolledAt: student.createdAt
    }))
  ).sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
  .slice(0, 10); // Last 10 enrollments

  return recentEnrollments;
}