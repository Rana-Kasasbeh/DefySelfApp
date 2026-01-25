const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');
const Habit = require('../models/Habit');

// @route   POST /api/habits
// @desc    Create new habit
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { habitName, description, duration, durationUnit, category, reminderTime } = req.body;
    
    // Validate input
    if (!habitName || !duration) {
      return res.status(400).json({ 
        success: false,
        message: 'اسم العادة والمدة مطلوبان'
      });
    }
    
    if (duration < 1) {
      return res.status(400).json({ 
        success: false,
        message: 'المدة يجب أن تكون يوم واحد على الأقل'
      });
    }
    
    // Create new habit
    const habit = new Habit({
      userId: req.user._id,
      habitName,
      description,
      duration,
      durationUnit: durationUnit || 'days',
      category: category || 'other',
      reminderTime
    });
    
    await habit.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء العادة بنجاح',
      habit
    });
    
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/habits
// @desc    Get all user habits
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const habits = await Habit.find(query).sort({ createdAt: -1 });
    
    // Add progress to each habit
    const habitsWithProgress = habits.map(habit => {
      const progress = habit.getProgress();
      return {
        ...habit.toObject(),
        progress
      };
    });
    
    res.json({
      success: true,
      count: habits.length,
      habits: habitsWithProgress
    });
    
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/habits/:id
// @desc    Get single habit
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'العادة غير موجودة'
      });
    }
    
    const progress = habit.getProgress();
    
    res.json({
      success: true,
      habit: {
        ...habit.toObject(),
        progress
      }
    });
    
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   PUT /api/habits/:id
// @desc    Update habit
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { habitName, description, duration, durationUnit, category, reminderTime, status } = req.body;
    
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'العادة غير موجودة'
      });
    }
    
    // Update fields
    if (habitName) habit.habitName = habitName;
    if (description !== undefined) habit.description = description;
    if (duration) habit.duration = duration;
    if (durationUnit) habit.durationUnit = durationUnit;
    if (category) habit.category = category;
    if (reminderTime !== undefined) habit.reminderTime = reminderTime;
    if (status) habit.status = status;
    
    await habit.save();
    
    const progress = habit.getProgress();
    
    res.json({
      success: true,
      message: 'تم تحديث العادة بنجاح',
      habit: {
        ...habit.toObject(),
        progress
      }
    });
    
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete habit
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'العادة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف العادة بنجاح'
    });
    
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   POST /api/habits/:id/mark-day
// @desc    Mark day as completed
// @access  Private
router.post('/:id/mark-day', authMiddleware, async (req, res) => {
  try {
    const { date, notes } = req.body;
    
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'العادة غير موجودة'
      });
    }
    
    await habit.markDayCompleted(date || new Date(), notes);
    
    const progress = habit.getProgress();
    
    res.json({
      success: true,
      message: 'تم تسجيل اليوم بنجاح',
      habit: {
        ...habit.toObject(),
        progress
      }
    });
    
  } catch (error) {
    console.error('Mark day error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/habits/active/count
// @desc    Get count of active habits
// @access  Private
router.get('/active/count', authMiddleware, async (req, res) => {
  try {
    const count = await Habit.countDocuments({
      userId: req.user._id,
      status: 'active'
    });
    
    res.json({
      success: true,
      count
    });
    
  } catch (error) {
    console.error('Get active count error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/habits/stats
// @desc    Get habit statistics
// @access  Private
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    
    const stats = {
      total: habits.length,
      active: habits.filter(h => h.status === 'active').length,
      completed: habits.filter(h => h.status === 'completed').length,
      failed: habits.filter(h => h.status === 'failed').length,
      totalStreak: habits.reduce((sum, h) => sum + h.streak.current, 0),
      longestStreak: Math.max(...habits.map(h => h.streak.longest), 0)
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

module.exports = router;
