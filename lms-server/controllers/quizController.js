// controllers/quizController.js
import QuizResult from '../models/QuizResult.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

// Submit quiz answers
export const submitQuiz = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers, timeTaken } = req.body;
    const userId = req.user._id;

    // Get the lesson with quiz questions
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (lesson.lessonType !== 'quiz') {
      return res.status(400).json({ message: 'This lesson is not a quiz' });
    }

    if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
      return res.status(400).json({ message: 'This quiz has no questions' });
    }

    // Validate answers
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswersCount = 0;

    lesson.quizQuestions.forEach((question, index) => {
      totalPoints += question.points || 1;
      
      const userAnswer = answers[index];
      if (userAnswer === question.correctAnswer) {
        earnedPoints += question.points || 1;
        correctAnswersCount++;
      }
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= 70; // 70% passing threshold

    // Save quiz result
    const quizResult = new QuizResult({
      user: userId,
      lesson: lessonId,
      answers,
      score,
      passed,
      totalQuestions: lesson.quizQuestions.length,
      correctAnswers: correctAnswersCount,
      timeTaken: timeTaken || 0
    });

    await quizResult.save();

    // If passed, mark lesson as completed
    if (passed) {
      const user = await User.findById(userId);
      const enrolledCourse = user.enrolledCourses.find(
        enrolled => enrolled.course.toString() === lesson.course.toString()
      );

      if (enrolledCourse && !enrolledCourse.completedLessons.includes(lessonId)) {
        enrolledCourse.completedLessons.push(lessonId);
        
        // Update progress
        const totalLessons = await Lesson.countDocuments({ course: lesson.course });
        enrolledCourse.progress = Math.round(
          (enrolledCourse.completedLessons.length / totalLessons) * 100
        );
        
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        totalQuestions: lesson.quizQuestions.length,
        correctAnswers: correctAnswersCount,
        answers: lesson.quizQuestions.map((question, index) => ({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: answers[index],
          isCorrect: answers[index] === question.correctAnswer,
          points: question.points || 1
        }))
      }
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ 
      message: 'Error submitting quiz', 
      error: error.message 
    });
  }
};

// Get quiz results for a user
export const getQuizResults = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    const results = await QuizResult.find({
      user: userId,
      lesson: lessonId
    })
    .populate('lesson', 'title')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz results', 
      error: error.message 
    });
  }
};

// Get best quiz result for a user
export const getBestQuizResult = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    const bestResult = await QuizResult.findOne({
      user: userId,
      lesson: lessonId
    })
    .sort({ score: -1, createdAt: -1 })
    .populate('lesson', 'title');

    res.status(200).json({
      success: true,
      data: bestResult
    });
  } catch (error) {
    console.error('Get best quiz result error:', error);
    res.status(500).json({ 
      message: 'Error fetching best quiz result', 
      error: error.message 
    });
  }
};