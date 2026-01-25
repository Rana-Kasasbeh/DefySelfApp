const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Generate 6-digit verification code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('الاسم يجب أن يكون حرفين على الأقل'),
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('age').isInt({ min: 13, max: 120 }).withMessage('العمر يجب أن يكون بين 13 و 120'),
  body('password').isLength({ min: 6 }).withMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { name, email, age, password } = req.body;

    // Check if name already exists
    const nameExists = await User.findOne({ name });
    if (nameExists) {
      return res.status(400).json({ 
        success: false,
        message: 'الاسم مستخدم بالفعل، يرجى اختيار اسم آخر'
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني مسجل بالفعل'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      age,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password').notEmpty().withMessage('كلمة السر مطلوبة')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني أو كلمة السر غير صحيحة'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني أو كلمة السر غير صحيحة'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send reset code to email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'البريد الإلكتروني غير مسجل'
      });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    
    // Set code expiry (2 minutes)
    const expiryTime = Date.now() + 120000; // 2 minutes

    // Save reset code and expiry
    user.resetCode = resetCode;
    user.resetCodeExpiry = expiryTime;
    await user.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'DefySelf - كود استعادة كلمة السر',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">DefySelf App</h2>
            <p style="color: #666; font-size: 16px;">مرحباً ${user.name}،</p>
            <p style="color: #666; font-size: 16px;">لقد طلبت استعادة كلمة السر الخاصة بك.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <p style="color: #666; margin: 0;">كود التحقق الخاص بك:</p>
              <h1 style="color: #007bff; font-size: 36px; margin: 10px 0; letter-spacing: 5px;">${resetCode}</h1>
            </div>
            <p style="color: #d63031; font-size: 14px;">⚠️ هذا الكود صالح لمدة دقيقتين فقط</p>
            <p style="color: #666; font-size: 14px;">إذا لم تطلب استعادة كلمة السر، يرجى تجاهل هذه الرسالة.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
      expiryTime: expiryTime
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في إرسال البريد الإلكتروني'
    });
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify reset code
// @access  Public
router.post('/verify-reset-code', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('الكود يجب أن يكون 6 أرقام')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, code } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'البريد الإلكتروني غير مسجل'
      });
    }

    // Check if code exists
    if (!user.resetCode) {
      return res.status(400).json({ 
        success: false,
        message: 'لم يتم طلب كود استعادة كلمة السر'
      });
    }

    // Check if code expired
    if (Date.now() > user.resetCodeExpiry) {
      user.resetCode = null;
      user.resetCodeExpiry = null;
      await user.save();
      
      return res.status(400).json({ 
        success: false,
        message: 'انتهت صلاحية الكود، يرجى طلب كود جديد'
      });
    }

    // Verify code
    if (user.resetCode !== code) {
      return res.status(400).json({ 
        success: false,
        message: 'الكود غير صحيح'
      });
    }

    res.json({
      success: true,
      message: 'تم التحقق من الكود بنجاح'
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with code
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('الكود يجب أن يكون 6 أرقام'),
  body('newPassword').isLength({ min: 6 }).withMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, code, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'البريد الإلكتروني غير مسجل'
      });
    }

    // Check if code exists and not expired
    if (!user.resetCode || Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ 
        success: false,
        message: 'الكود غير صالح أو انتهت صلاحيته'
      });
    }

    // Verify code
    if (user.resetCode !== code) {
      return res.status(400).json({ 
        success: false,
        message: 'الكود غير صحيح'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'تم تغيير كلمة السر بنجاح'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

module.exports = router;
