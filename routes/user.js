const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');
const User = require('../models/User');
const WaterTracking = require('../models/WaterTracking');
const Habit = require('../models/Habit');
const LearningProgress = require('../models/LearningProgress');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetCode -resetCodeExpiry');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   PUT /api/user/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { soundEnabled, notificationsEnabled } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (soundEnabled !== undefined) {
      user.settings.soundEnabled = soundEnabled;
    }
    
    if (notificationsEnabled !== undefined) {
      user.settings.notificationsEnabled = notificationsEnabled;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Delete all user data
    await Promise.all([
      User.findByIdAndDelete(userId),
      WaterTracking.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      LearningProgress.deleteOne({ userId })
    ]);
    
    res.json({
      success: true,
      message: 'تم حذف الحساب بنجاح'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في حذف الحساب'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, age } = req.body;
    const user = await User.findById(req.user._id);
    
    // Check if new name is already taken by another user
    if (name && name !== user.name) {
      const nameExists = await User.findOne({ name, _id: { $ne: user._id } });
      if (nameExists) {
        return res.status(400).json({ 
          success: false,
          message: 'الاسم مستخدم بالفعل'
        });
      }
      user.name = name;
    }
    
    if (age) {
      if (age < 13 || age > 120) {
        return res.status(400).json({ 
          success: false,
          message: 'العمر يجب أن يكون بين 13 و 120'
        });
      }
      user.age = age;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

module.exports = router;
