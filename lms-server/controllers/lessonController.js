import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// Get all lessons for a course
export const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .sort({ order: 1 })
      .populate('course', 'title instructor');
    
    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single lesson
export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title instructor');
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create lesson - Updated to handle all lesson types
export const createLesson = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      duration, 
      lessonType, 
      videoUrl, 
      isPreview, 
      order, 
      course,
      quizQuestions,
      articleContent
    } = req.body;
    
    const courseDoc = await Course.findById(course);
    
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is course owner or admin
    if (courseDoc.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create lessons for this course' });
    }
    
    // Handle file upload
    let finalVideoUrl = videoUrl;
    if (req.file) {
      finalVideoUrl = `/uploads/videos/${req.file.filename}`;
    }
    
    // Parse boolean values
    const isPreviewBool = isPreview === 'true' || isPreview === true;
    const orderNum = parseInt(order) || 0;
    const durationNum = parseInt(duration) || 0;
    
    // Parse quiz questions if provided
    let parsedQuizQuestions = [];
    if (quizQuestions && typeof quizQuestions === 'string') {
      try {
        parsedQuizQuestions = JSON.parse(quizQuestions);
      } catch (error) {
        return res.status(400).json({ 
          message: 'Invalid quiz questions format' 
        });
      }
    } else if (Array.isArray(quizQuestions)) {
      parsedQuizQuestions = quizQuestions;
    }
    
    // Validate based on lesson type
    if (lessonType === 'video') {
      if (!finalVideoUrl && !videoUrl) {
        return res.status(400).json({ 
          message: 'Video URL or video file is required for video lessons' 
        });
      }
    } else if (lessonType === 'quiz') {
      if (!parsedQuizQuestions || parsedQuizQuestions.length === 0) {
        return res.status(400).json({ 
          message: 'Quiz questions are required for quiz lessons' 
        });
      }
      
      // Validate each quiz question
      for (const question of parsedQuizQuestions) {
        if (!question.question || !question.options || !Array.isArray(question.options)) {
          return res.status(400).json({ 
            message: 'Invalid quiz question format' 
          });
        }
      }
    } else if (lessonType === 'article') {
      if (!articleContent) {
        return res.status(400).json({ 
          message: 'Article content is required for article lessons' 
        });
      }
    }
    
    const lessonData = {
      title,
      content,
      duration: durationNum,
      lessonType,
      isPreview: isPreviewBool,
      order: orderNum,
      course,
      videoUrl: finalVideoUrl,
      articleContent,
      quizQuestions: parsedQuizQuestions
    };
    
    // Remove fields that shouldn't be set for certain lesson types
    if (lessonType !== 'video') {
      lessonData.videoUrl = undefined;
    }
    if (lessonType !== 'article') {
      lessonData.articleContent = undefined;
    }
    if (lessonType !== 'quiz') {
      lessonData.quizQuestions = undefined;
    }
    
    const lesson = await Lesson.create(lessonData);
    
    // ===== FIXED SECTION =====
    // Add lesson to course using atomic operation - handles cases where lessons array doesn't exist
    await Course.findByIdAndUpdate(
      course,
      { $push: { lessons: lesson._id } },
      { new: true }
    );
    // ===== END FIX =====
    
    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Update lesson - Updated to handle all lesson types
export const updateLesson = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      duration, 
      lessonType, 
      videoUrl, 
      isPreview, 
      order,
      quizQuestions,
      articleContent
    } = req.body;
    
    let lesson = await Lesson.findById(req.params.id)
      .populate('course', 'instructor');
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user is course owner or admin
    if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this lesson' });
    }
    
    // Handle file upload
    let finalVideoUrl = videoUrl;
    if (req.file) {
      finalVideoUrl = `/uploads/videos/${req.file.filename}`;
      // You might want to delete the old video file here
    }
    
    // Parse boolean values
    const isPreviewBool = isPreview === 'true' || isPreview === true;
    const orderNum = parseInt(order) || lesson.order;
    const durationNum = parseInt(duration) || lesson.duration;
    
    // Parse quiz questions if provided
    let parsedQuizQuestions = lesson.quizQuestions;
    if (quizQuestions && typeof quizQuestions === 'string') {
      try {
        parsedQuizQuestions = JSON.parse(quizQuestions);
      } catch (error) {
        return res.status(400).json({ 
          message: 'Invalid quiz questions format' 
        });
      }
    } else if (Array.isArray(quizQuestions)) {
      parsedQuizQuestions = quizQuestions;
    }
    
    // Validate based on lesson type
    if (lessonType === 'video') {
      if (!finalVideoUrl && !videoUrl) {
        return res.status(400).json({ 
          message: 'Video URL or video file is required for video lessons' 
        });
      }
    } else if (lessonType === 'quiz') {
      if (!parsedQuizQuestions || parsedQuizQuestions.length === 0) {
        return res.status(400).json({ 
          message: 'Quiz questions are required for quiz lessons' 
        });
      }
    } else if (lessonType === 'article') {
      if (!articleContent) {
        return res.status(400).json({ 
          message: 'Article content is required for article lessons' 
        });
      }
    }
    
    const updateData = {
      title,
      content,
      duration: durationNum,
      lessonType,
      isPreview: isPreviewBool,
      order: orderNum,
      videoUrl: finalVideoUrl,
      articleContent,
      quizQuestions: parsedQuizQuestions
    };
    
    // Remove fields that shouldn't be updated for certain lesson types
    if (lessonType !== 'video') {
      updateData.videoUrl = undefined;
    }
    if (lessonType !== 'article') {
      updateData.articleContent = undefined;
    }
    if (lessonType !== 'quiz') {
      updateData.quizQuestions = undefined;
    }
    
    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Delete lesson (unchanged)
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'instructor');
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user is course owner or admin
    if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }
    
    await Lesson.findByIdAndDelete(req.params.id);
    
    // Remove lesson from course using atomic operation
    await Course.findByIdAndUpdate(
      lesson.course._id,
      { $pull: { lessons: req.params.id } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark lesson as completed (unchanged)
export const completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user is enrolled in the course
    const enrolledCourse = user.enrolledCourses.find(
      enrolled => enrolled.course.toString() === lesson.course.toString()
    );
    
    if (!enrolledCourse) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    // Check if lesson is already completed
    if (enrolledCourse.completedLessons.includes(req.params.id)) {
      return res.status(400).json({ message: 'Lesson already completed' });
    }
    
    // Add to completed lessons
    enrolledCourse.completedLessons.push(req.params.id);
    
    // Update progress
    const totalLessons = await Lesson.countDocuments({ course: lesson.course });
    enrolledCourse.progress = Math.round(
      (enrolledCourse.completedLessons.length / totalLessons) * 100
    );
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
      progress: enrolledCourse.progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};