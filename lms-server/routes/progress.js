import express from 'express';
import Progress from '../models/Progress.js';
import { authorize as auth } from '../middleware/auth.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

const router = express.Router();

// Optimized: Get user progress for a course
router.get('/courses/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('Getting progress for course:', courseId);
    
    // First, get progress without population for faster response
    let progress = await Progress.findOne({
      userId: req.user.id,
      courseId
    }).lean(); // Use lean() for faster query

    // If no progress exists, create a default one without heavy operations
    if (!progress) {
      console.log('No progress found, creating default...');
      progress = new Progress({
        userId: req.user.id,
        courseId,
        progress: 0,
        status: 'in-progress',
        startedAt: new Date(),
        lastAccessedAt: new Date()
      });
      await progress.save();
      
      // Convert to plain object for response
      progress = progress.toObject();
      
      res.json({ 
        success: true,
        data: {
          ...progress,
          lessons: [] // Empty lessons array for new progress
        }
      });
      return;
    }

    // If progress exists, populate only necessary fields
    const populatedProgress = await Progress.findById(progress._id)
      .populate('lessons.lessonId', 'title duration order') // Only needed fields
      .populate('lastAccessedLesson', 'title')
      .lean();

    console.log('Progress found, returning data');
    
    res.json({ 
      success: true,
      data: populatedProgress 
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Optimized: Update lesson progress
router.post('/courses/:courseId/lessons/:lessonId', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { completed, videoTimestamp, quizScore } = req.body;
    
    console.log('Updating lesson progress for:', { courseId, lessonId });

    // Quick validation - don't wait for lesson verification initially
    let progress = await Progress.findOne({
      userId: req.user.id,
      courseId
    });

    const now = new Date();
    
    if (!progress) {
      console.log('Creating new progress record...');
      progress = new Progress({
        userId: req.user.id,
        courseId,
        lessons: [{
          lessonId,
          completed: completed || false,
          completedAt: completed ? now : undefined,
          lastAccessedAt: now,
          videoTimestamp: videoTimestamp || 0,
          quizScore: quizScore || undefined
        }],
        progress: 0,
        status: 'in-progress',
        startedAt: now,
        lastAccessedAt: now,
        lastAccessedLesson: lessonId
      });
    } else {
      const lessonIndex = progress.lessons.findIndex(
        lesson => lesson.lessonId.toString() === lessonId
      );
      
      if (lessonIndex !== -1) {
        // Update existing lesson progress
        const lessonProgress = progress.lessons[lessonIndex];
        
        if (completed !== undefined) {
          lessonProgress.completed = completed;
          if (completed && !lessonProgress.completedAt) {
            lessonProgress.completedAt = now;
          }
        }
        
        lessonProgress.lastAccessedAt = now;
        lessonProgress.videoTimestamp = videoTimestamp !== undefined ? videoTimestamp : lessonProgress.videoTimestamp;
        
        if (quizScore !== undefined) {
          lessonProgress.quizScore = quizScore;
        }
        
      } else {
        // Add new lesson progress
        progress.lessons.push({
          lessonId,
          completed: completed || false,
          completedAt: completed ? now : undefined,
          lastAccessedAt: now,
          videoTimestamp: videoTimestamp || 0,
          quizScore: quizScore || undefined
        });
      }
      
      progress.lastAccessedAt = now;
      progress.lastAccessedLesson = lessonId;
    }

    // Quick progress calculation without heavy database query
    const completedLessons = progress.lessons.filter(lesson => lesson.completed).length;
    
    // Estimate total lessons - we'll update this properly after save
    progress.progress = Math.min(completedLessons * 10, 100); // Temporary calculation
    
    await progress.save();

    // Now do the proper progress calculation in background
    setTimeout(async () => {
      try {
        const totalLessons = await Lesson.countDocuments({ course: courseId });
        const actualCompletedLessons = progress.lessons.filter(lesson => lesson.completed).length;
        const newProgress = totalLessons > 0 ? Math.round((actualCompletedLessons / totalLessons) * 100) : 0;
        
        // Update status
        let status = 'in-progress';
        if (actualCompletedLessons === totalLessons && totalLessons > 0) {
          status = 'completed';
        }

        await Progress.findByIdAndUpdate(progress._id, {
          progress: newProgress,
          status: status,
          ...(status === 'completed' && { completedAt: now })
        });
        
        console.log('Background progress update completed:', { newProgress, status });
      } catch (bgError) {
        console.error('Background progress update failed:', bgError);
      }
    }, 0);

    // Return immediate response without heavy population
    const quickResponse = await Progress.findById(progress._id)
      .select('progress status lessons lastAccessedAt lastAccessedLesson')
      .lean();

    console.log('Progress updated, returning quick response');
    
    res.json({ 
      success: true,
      data: quickResponse 
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Quick progress check without heavy operations
router.get('/courses/:courseId/quick', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const progress = await Progress.findOne({
      userId: req.user.id,
      courseId
    })
    .select('progress status lastAccessedAt lastAccessedLesson') // Only essential fields
    .lean();

    res.json({ 
      success: true,
      data: progress || { 
        progress: 0, 
        status: 'not-started',
        lastAccessedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Quick progress error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all progress for user (optimized)
router.get('/', auth, async (req, res) => {
  try {
    const progress = await Progress.find({
      userId: req.user.id
    })
    .select('courseId progress status lastAccessedAt startedAt') // Only essential fields
    .populate('courseId', 'title imageUrl instructor category') // Light population
    .sort({ lastAccessedAt: -1 })
    .lean();

    console.log('Found progress records:', progress.length);
    
    res.json({ 
      success: true,
      data: progress 
    });
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

export default router;