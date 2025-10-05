// routes/quiz.js
import express from 'express';
import {
  submitQuiz,
  getQuizResults,
  getBestQuizResult
} from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/quiz/:lessonId/submit - Submit quiz answers
router.post('/:lessonId/submit', protect, submitQuiz);

// GET /api/quiz/:lessonId/results - Get all quiz attempts for a lesson
router.get('/:lessonId/results', protect, getQuizResults);

// GET /api/quiz/:lessonId/best - Get best quiz result for a lesson
router.get('/:lessonId/best', protect, getBestQuizResult);

export default router;