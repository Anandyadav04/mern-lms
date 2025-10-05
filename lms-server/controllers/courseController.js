import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Course.countDocuments({ isPublished: true });
    
    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single course
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('studentsEnrolled', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get course lessons
    const lessons = await Lesson.find({ course: req.params.id })
      .sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        course,
        lessons
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    console.log('Request file:', req.file); 
    console.log('Request body:', req.body);
    
    req.body.instructor = req.user.id;
    
    if (req.file) {
      req.body.imageUrl = `/uploads/images/${req.file.filename}`;
      console.log('Image URL set to:', req.body.imageUrl);
    }
    
    const course = await Course.create(req.body);
    console.log('Course created:', course);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error in createCourse:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    if (req.file) {
      req.body.imageUrl = `/uploads/images/${req.file.filename}`;
    }
    
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }
    
    // Delete associated lessons
    await Lesson.deleteMany({ course: req.params.id });
    
    await Course.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enroll in course
export const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrolled => enrolled.course.toString() === req.params.id
    );
    
    if (isEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Add to user's enrolled courses
    user.enrolledCourses.push({
      course: req.params.id,
      progress: 0,
      enrolledAt: new Date()
    });
    
    await user.save();
    
    // Add to course's students enrolled
    course.studentsEnrolled.push(req.user.id);
    await course.save();
    
    res.status(200).json({
      success: true,
      message: 'Enrolled in course successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};