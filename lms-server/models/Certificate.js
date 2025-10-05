import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  certificateCode: {
    type: String,
    unique: true,
    required: true,
  },
});

export default mongoose.model('Certificate', certificateSchema);
