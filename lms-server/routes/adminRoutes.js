// routes/adminRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(authorize('admin'));

// Admin dashboard statistics - UPDATED FOR YOUR MODEL
router.get('/dashboard/stats', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching dashboard stats for user:', req.user.email);
    
    // Get counts - using isPublished instead of status
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const pendingCourses = await Course.countDocuments({ isPublished: false }); // Unpublished courses as "pending"

    console.log('📊 ADMIN: Database counts:', {
      totalStudents,
      totalInstructors, 
      totalCourses,
      pendingCourses
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalInstructors,
        totalCourses,
        pendingCourses,
        recentEnrollments: []
      }
    });
  } catch (error) {
    console.error('❌ ADMIN: Error in dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all courses - UPDATED FOR YOUR MODEL
router.get('/courses', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Map status to isPublished for your model
    if (status === 'pending') {
      filter.isPublished = false;
    } else if (status === 'approved') {
      filter.isPublished = true;
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get pending courses - UPDATED FOR YOUR MODEL
router.get('/courses/pending', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: false }) // Unpublished = pending
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update course status - UPDATED FOR YOUR MODEL
router.patch('/courses/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    let updateData = {};
    
    // Map status to isPublished
    if (status === 'approved') {
      updateData.isPublished = true;
    } else if (status === 'rejected') {
      updateData.isPublished = false;
      if (reason) updateData.rejectionReason = reason;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    
    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ADD THESE MISSING ROUTES:
// Add this route to your adminRoutes.js

// Create new user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, role'
      });
    }

    // Validate role
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: student, instructor, admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (password will be hashed by User model pre-save hook)
    const user = new User({
      name,
      email,
      password,
      role,
      avatar: '',
      enrolledCourses: []
    });

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');

    console.log(`✅ ADMIN: Created new ${role} user: ${email}`);

    res.status(201).json({
      success: true,
      data: userResponse,
      message: `User created successfully as ${role}`
    });
  } catch (error) {
    console.error('❌ ADMIN: Error creating user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: student, instructor, admin'
      });
    }

    // Prevent self-role-change (admin changing their own role)
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ ADMIN: Updated user ${user.email} role to ${role}`);

    res.json({
      success: true,
      data: user,
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    console.error('❌ ADMIN: Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If deleting an instructor, handle their courses
    if (user.role === 'instructor') {
      // Option 1: Delete instructor's courses
      // await Course.deleteMany({ instructor: user._id });
      
      // Option 2: Transfer courses to another instructor or mark as archived
      await Course.updateMany(
        { instructor: user._id },
        { $set: { isPublished: false, status: 'archived' } }
      );
      
      console.log(`📝 ADMIN: Archived courses for instructor ${user.email}`);
    }

    await User.findByIdAndDelete(req.params.id);

    console.log(`✅ ADMIN: Deleted user ${user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ ADMIN: Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// Analytics and Reports Routes
router.get('/analytics/overview', async (req, res) => {
  try {
    console.log('📊 ADMIN: Fetching analytics overview');
    
    // Get basic counts
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const pendingCourses = await Course.countDocuments({ isPublished: false });

    // Get enrollment statistics
    const totalEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $count: 'totalEnrollments' }
    ]);

    // Get recent growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newStudents = await User.countDocuments({ 
      role: 'student', 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    const newInstructors = await User.countDocuments({ 
      role: 'instructor', 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    const newCourses = await Course.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Get popular courses
    const popularCourses = await Course.aggregate([
      {
        $project: {
          title: 1,
          instructor: 1,
          studentsCount: { $size: '$studentsEnrolled' },
          averageRating: 1,
          isPublished: 1
        }
      },
      { $sort: { studentsCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorInfo'
        }
      },
      {
        $project: {
          title: 1,
          studentsCount: 1,
          averageRating: 1,
          instructorName: { $arrayElemAt: ['$instructorInfo.name', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalInstructors,
          totalCourses,
          publishedCourses,
          pendingCourses,
          totalEnrollments: totalEnrollments[0]?.totalEnrollments || 0
        },
        growth: {
          newStudents,
          newInstructors,
          newCourses,
          period: 'last_30_days'
        },
        popularCourses
      }
    });
  } catch (error) {
    console.error('❌ ADMIN: Error in analytics overview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Enrollment trends over time
router.get('/analytics/enrollments', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // monthly, weekly, daily
    
    let groupFormat;
    switch (period) {
      case 'daily':
        groupFormat = { day: { $dayOfMonth: '$enrolledAt' }, month: { $month: '$enrolledAt' }, year: { $year: '$enrolledAt' } };
        break;
      case 'weekly':
        groupFormat = { week: { $week: '$enrolledAt' }, year: { $year: '$enrolledAt' } };
        break;
      default: // monthly
        groupFormat = { month: { $month: '$enrolledAt' }, year: { $year: '$enrolledAt' } };
    }

    const enrollmentTrends = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      {
        $group: {
          _id: groupFormat,
          enrollments: { $sum: 1 },
          date: { $first: '$enrolledCourses.enrolledAt' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        period,
        trends: enrollmentTrends
      }
    });
  } catch (error) {
    console.error('❌ ADMIN: Error in enrollment analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Course performance analytics
router.get('/analytics/courses', async (req, res) => {
  try {
    const coursePerformance = await Course.aggregate([
      {
        $project: {
          title: 1,
          instructor: 1,
          category: 1,
          studentsEnrolled: 1,
          ratings: 1,
          averageRating: 1,
          isPublished: 1,
          createdAt: 1,
          enrollmentCount: { $size: '$studentsEnrolled' },
          reviewCount: { $size: '$ratings' }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorInfo'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          enrollmentCount: 1,
          averageRating: 1,
          reviewCount: 1,
          isPublished: 1,
          createdAt: 1,
          instructorName: { $arrayElemAt: ['$instructorInfo.name', 0] },
          instructorEmail: { $arrayElemAt: ['$instructorInfo.email', 0] }
        }
      }
    ]);

    // Calculate overall stats
    const totalEnrollments = coursePerformance.reduce((sum, course) => sum + course.enrollmentCount, 0);
    const averageEnrollments = totalEnrollments / coursePerformance.length || 0;
    const publishedCourses = coursePerformance.filter(course => course.isPublished).length;

    res.json({
      success: true,
      data: {
        courses: coursePerformance,
        stats: {
          totalCourses: coursePerformance.length,
          publishedCourses,
          totalEnrollments,
          averageEnrollments: Math.round(averageEnrollments * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('❌ ADMIN: Error in course analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// User engagement analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const userEngagement = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $project: {
          name: 1,
          email: 1,
          enrolledCourses: 1,
          createdAt: 1,
          courseCount: { $size: '$enrolledCourses' },
          lastActive: { $max: '$enrolledCourses.enrolledAt' }
        }
      },
      { $sort: { courseCount: -1 } },
      { $limit: 50 }
    ]);

    // Calculate engagement stats
    const activeUsers = userEngagement.filter(user => user.courseCount > 0).length;
    const totalEnrollments = userEngagement.reduce((sum, user) => sum + user.courseCount, 0);
    const averageCoursesPerUser = totalEnrollments / userEngagement.length || 0;

    res.json({
      success: true,
      data: {
        users: userEngagement,
        stats: {
          totalStudents: userEngagement.length,
          activeUsers,
          totalEnrollments,
          averageCoursesPerUser: Math.round(averageCoursesPerUser * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('❌ ADMIN: Error in user analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate reports
router.get('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query; // json, csv

    let reportData;

    switch (type) {
      case 'users':
        const users = await User.find().select('name email role createdAt enrolledCourses').lean();
        reportData = users.map(user => ({
          name: user.name,
          email: user.email,
          role: user.role,
          joined: user.createdAt,
          coursesEnrolled: user.enrolledCourses?.length || 0
        }));
        break;

      case 'courses':
        const courses = await Course.find().populate('instructor', 'name email').lean();
        reportData = courses.map(course => ({
          title: course.title,
          category: course.category,
          instructor: course.instructor?.name,
          price: course.price,
          students: course.studentsEnrolled?.length || 0,
          status: course.isPublished ? 'Published' : 'Pending',
          created: course.createdAt,
          rating: course.averageRating || 0
        }));
        break;

      case 'enrollments':
        const enrollmentReport = await User.aggregate([
          { $unwind: '$enrolledCourses' },
          {
            $lookup: {
              from: 'courses',
              localField: 'enrolledCourses.course',
              foreignField: '_id',
              as: 'courseInfo'
            }
          },
          {
            $project: {
              studentName: '$name',
              studentEmail: '$email',
              courseTitle: { $arrayElemAt: ['$courseInfo.title', 0] },
              enrolledAt: '$enrolledCourses.enrolledAt',
              progress: '$enrolledCourses.progress'
            }
          },
          { $sort: { enrolledAt: -1 } }
        ]);
        reportData = enrollmentReport;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Use: users, courses, or enrollments'
        });
    }

    if (format === 'csv') {
      // Simple CSV conversion
      const headers = Object.keys(reportData[0] || {}).join(',');
      const rows = reportData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      ).join('\n');
      
      const csv = `${headers}\n${rows}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: {
        type,
        generatedAt: new Date(),
        recordCount: reportData.length,
        data: reportData
      }
    });

  } catch (error) {
    console.error('❌ ADMIN: Error generating report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add this route to your adminRoutes.js

// Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Optional: Add additional checks here
    // For example, you might want to prevent deletion of courses with active enrollments
    if (course.studentsEnrolled && course.studentsEnrolled.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with enrolled students. Please archive instead.'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    console.log(`✅ ADMIN: Deleted course: ${course.title}`);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('❌ ADMIN: Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;