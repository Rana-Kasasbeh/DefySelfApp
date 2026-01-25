const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');
const WaterTracking = require('../models/WaterTracking');

// @route   POST /api/water/setup
// @desc    Setup water tracking with user data
// @access  Private
router.post('/setup', authMiddleware, async (req, res) => {
  try {
    const { weight, activityLevel, weatherCondition } = req.body;
    
    // Validate input
    if (!weight || !activityLevel || !weatherCondition) {
      return res.status(400).json({ 
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }
    
    if (weight < 30) {
      return res.status(400).json({ 
        success: false,
        message: 'الوزن يجب أن يكون 30 كجم على الأقل'
      });
    }
    
    // Calculate daily water goal
    const dailyWaterGoal = WaterTracking.calculateWaterGoal(weight, activityLevel, weatherCondition);
    
    // Check if user has tracking for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let waterTracking = await WaterTracking.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });
    
    if (waterTracking) {
      // Update existing tracking
      waterTracking.weight = weight;
      waterTracking.activityLevel = activityLevel;
      waterTracking.weatherCondition = weatherCondition;
      waterTracking.dailyWaterGoal = dailyWaterGoal;
    } else {
      // Create new tracking
      waterTracking = new WaterTracking({
        userId: req.user._id,
        weight,
        activityLevel,
        weatherCondition,
        dailyWaterGoal,
        date: today
      });
    }
    
    await waterTracking.save();
    
    // Get health tips
    const healthTips = waterTracking.getHealthTips();
    
    res.json({
      success: true,
      message: 'تم إعداد متابعة الماء بنجاح',
      data: {
        dailyWaterGoal,
        glassSize: waterTracking.glassSize,
        totalGlassesNeeded: Math.ceil(dailyWaterGoal / waterTracking.glassSize),
        healthTips
      }
    });
    
  } catch (error) {
    console.error('Water setup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/water/today
// @desc    Get today's water tracking
// @access  Private
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const waterTracking = await WaterTracking.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });
    
    if (!waterTracking) {
      return res.json({
        success: true,
        data: null,
        message: 'لم يتم إعداد متابعة الماء لهذا اليوم'
      });
    }
    
    const healthTips = waterTracking.getHealthTips();
    const totalConsumed = waterTracking.glassesConsumed * waterTracking.glassSize;
    const percentage = Math.round((totalConsumed / waterTracking.dailyWaterGoal) * 100);
    
    res.json({
      success: true,
      data: {
        glassesConsumed: waterTracking.glassesConsumed,
        glassSize: waterTracking.glassSize,
        totalConsumed,
        dailyWaterGoal: waterTracking.dailyWaterGoal,
        totalGlassesNeeded: Math.ceil(waterTracking.dailyWaterGoal / waterTracking.glassSize),
        percentage,
        healthTips,
        weight: waterTracking.weight,
        activityLevel: waterTracking.activityLevel,
        weatherCondition: waterTracking.weatherCondition
      }
    });
    
  } catch (error) {
    console.error('Get water tracking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   POST /api/water/add-glass
// @desc    Add a glass of water
// @access  Private
router.post('/add-glass', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const waterTracking = await WaterTracking.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });
    
    if (!waterTracking) {
      return res.status(404).json({ 
        success: false,
        message: 'يرجى إعداد متابعة الماء أولاً'
      });
    }
    
    waterTracking.glassesConsumed += 1;
    await waterTracking.save();
    
    const totalConsumed = waterTracking.glassesConsumed * waterTracking.glassSize;
    const percentage = Math.round((totalConsumed / waterTracking.dailyWaterGoal) * 100);
    const healthTips = waterTracking.getHealthTips();
    
    res.json({
      success: true,
      message: 'تم إضافة كأس ماء',
      data: {
        glassesConsumed: waterTracking.glassesConsumed,
        totalConsumed,
        dailyWaterGoal: waterTracking.dailyWaterGoal,
        percentage,
        healthTips
      }
    });
    
  } catch (error) {
    console.error('Add glass error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/water/history
// @desc    Get water tracking history
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    const history = await WaterTracking.find({
      userId: req.user._id,
      date: { $gte: startDate }
    }).sort({ date: -1 });
    
    const formattedHistory = history.map(day => {
      const totalConsumed = day.glassesConsumed * day.glassSize;
      const percentage = Math.round((totalConsumed / day.dailyWaterGoal) * 100);
      
      return {
        date: day.date,
        glassesConsumed: day.glassesConsumed,
        totalConsumed,
        dailyWaterGoal: day.dailyWaterGoal,
        percentage,
        achieved: percentage >= 100
      };
    });
    
    res.json({
      success: true,
      data: formattedHistory
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   PUT /api/water/notification-times
// @desc    Set notification times for water reminders
// @access  Private
router.put('/notification-times', authMiddleware, async (req, res) => {
  try {
    const { notificationTimes } = req.body;
    
    if (!Array.isArray(notificationTimes)) {
      return res.status(400).json({ 
        success: false,
        message: 'يجب أن تكون أوقات التذكير مصفوفة'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const waterTracking = await WaterTracking.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });
    
    if (!waterTracking) {
      return res.status(404).json({ 
        success: false,
        message: 'يرجى إعداد متابعة الماء أولاً'
      });
    }
    
    waterTracking.notificationTimes = notificationTimes;
    await waterTracking.save();
    
    res.json({
      success: true,
      message: 'تم تحديث أوقات التذكير بنجاح',
      notificationTimes: waterTracking.notificationTimes
    });
    
  } catch (error) {
    console.error('Update notification times error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

module.exports = router;
