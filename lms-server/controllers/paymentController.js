import Razorpay from 'razorpay';
import crypto from 'crypto';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';

// Initialize Razorpay with test keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_9qHBSaLsL8d7oM',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'G0vJjdqJX6Q3XqR5k6n1oJ0M',
});

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { amount, courseId } = req.body;
    const userId = req.user.id; // From auth middleware

    console.log('Creating order for:', { amount, courseId, userId });

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount, // Already in paise from frontend
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    // Save payment record
    const payment = new Payment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      course: courseId,
      user: userId,
      status: 'created'
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Verify payment signature
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId
    } = req.body;

    const userId = req.user.id;

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, courseId, userId });

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'G0vJjdqJX6Q3XqR5k6n1oJ0M')
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature verified - update payment status
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          status: 'captured',
          signature: razorpay_signature,
          paidAt: new Date()
        }
      );

      // Check if enrollment already exists
      const existingEnrollment = await Enrollment.findOne({
        user: userId,
        course: courseId
      });

      if (!existingEnrollment) {
        // Create new enrollment
        const enrollment = new Enrollment({
          user: userId,
          course: courseId,
          enrolledAt: new Date(),
          paymentStatus: 'paid'
        });

        await enrollment.save();
        console.log('New enrollment created for user:', userId);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: razorpay_payment_id,
          enrolled: true
        }
      });

    } else {
      // Signature verification failed
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed', error: 'Signature verification failed' }
      );

      console.error('Signature verification failed');
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId })
      .populate('course', 'title price')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Simple webhook handler (optional for now)
export const handleWebhook = async (req, res) => {
  try {
    console.log('Webhook received:', req.body);
    // For now, just acknowledge the webhook
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};