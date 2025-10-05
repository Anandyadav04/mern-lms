// routes/analytics.js
import express from 'express';
import { protect, instructorOnly } from '../middleware/auth.js';
import {
  getCourseAnalytics,
  getStudentProgress,
  getInstructorOverview
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(protect);
router.use(instructorOnly);

router.get('/overview', getInstructorOverview);
router.get('/course/:courseId', getCourseAnalytics);
router.get('/students/progress', getStudentProgress);

export default router;