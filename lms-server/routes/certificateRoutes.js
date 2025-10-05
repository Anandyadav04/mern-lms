import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  generateCertificate,
  getUserCertificate,
  getUserCertificates,
  getCertificateById,
  downloadCertificate,
  viewCertificate,
  verifyCertificate,
  shareCertificate
} from '../controllers/certificateController.js';

const router = express.Router();

router.post('/', protect, generateCertificate);
router.get('/course/:courseId', protect, getUserCertificate);
router.get('/user', protect, getUserCertificates);
router.get('/:id', protect, getCertificateById);
router.get('/:id/download', protect, downloadCertificate);
router.get('/:id/view', protect, viewCertificate);
router.get('/:id/verify', verifyCertificate);
router.post('/:id/share', protect, shareCertificate);

export default router;
