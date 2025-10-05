// backend/routes/lessons.js
import express from 'express';
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  completeLesson
} from '../controllers/lessonController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadLessonFile } from '../middleware/upload.js';

const router = express.Router();

router.route('/course/:courseId')
  .get(getLessons)
  .post(protect, uploadLessonFile.single('video'), createLesson);

router.route('/:id')
  .get(getLesson)
  .put(protect, uploadLessonFile.single('video'), updateLesson)
  .delete(protect, deleteLesson);

router.route('/:id/complete')
  .post(protect, completeLesson);

export default router;