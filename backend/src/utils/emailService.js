import nodemailer from 'nodemailer';
import { emailTemplates } from './emailTemplates.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    rateLimit: 10 // Max emails per second
  });
};

let transporter = null;

// Get transporter instance (singleton)
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@ecommerce.com',
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  const html = emailTemplates.welcomeEmail(user.name);
  return await sendEmail({
    email: user.email,
    subject: 'Welcome to Our Store! 🎉',
    html
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = emailTemplates.passwordResetEmail(user.name, resetUrl);
  return await sendEmail({
    email: user.email,
    subject: 'Password Reset Request',
    html
  });
};

// Send email verification
export const sendVerificationEmail = async (user, verifyToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  const html = emailTemplates.verificationEmail(user.name, verifyUrl);
  return await sendEmail({
    email: user.email,
    subject: 'Verify Your Email Address',
    html
  });
};
