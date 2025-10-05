// scripts/createAdmin.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const admin = new User({
      name: 'System Administrator',
      email: 'admin@lms.com',
      password: 'admin123', // Will be hashed by pre-save middleware
      role: 'admin',
      avatar: ''
    });

    await admin.save();
    console.log('Default admin user created successfully');
    console.log('Email: admin@lms.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
  }
};

createAdminUser();