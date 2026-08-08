import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Admin ရှိပြီးသားလား စစ်ပါ
    const adminExists = await User.findOne({ email: 'admin@shopstore.com' });
    
    if (adminExists) {
      console.log('✅ Admin already exists');
      console.log(`📧 Email: admin@shopstore.com`);
      process.exit(0);
    }

    // Admin ဖန်တီးပါ
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@shopstore.com',
      password: 'Admin123!@#',
      role: 'admin',
      isVerified: true,
      phone: '+959123456789'
    });

    console.log('✅ Admin created successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log('📧 Email: admin@shopstore.com');
    console.log('🔑 Password: Admin123!@#');
    console.log('═══════════════════════════════════════════════');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();