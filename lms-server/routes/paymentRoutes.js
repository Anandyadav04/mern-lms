import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  handleWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public webhook route (Razorpay calls this)
router.post('/webhook', handleWebhook);

// Protected routes
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/:orderId', protect, getPaymentDetails);

export default router;