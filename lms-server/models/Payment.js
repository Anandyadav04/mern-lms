import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'captured', 'failed'],
    default: 'created'
  },
  signature: {
    type: String
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);