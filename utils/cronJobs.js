const cron = require('node-cron');
const User = require('../models/User');
const WaterTracking = require('../models/WaterTracking');
const Habit = require('../models/Habit');
const LearningProgress = require('../models/LearningProgress');

// Delete inactive accounts (45 days without login)
const deleteInactiveAccounts = async () => {
  try {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    
    const inactiveUsers = await User.find({
      lastLogin: { $lt: fortyFiveDaysAgo }
    });
    
    for (const user of inactiveUsers) {
      const userId = user._id;
      
      // Delete user and all related data
      await Promise.all([
        User.findByIdAndDelete(userId),
        WaterTracking.deleteMany({ userId }),
        Habit.deleteMany({ userId }),
        LearningProgress.deleteOne({ userId })
      ]);
      
      console.log(`Deleted inactive account: ${user.email} (${user.name})`);
    }
    
    if (inactiveUsers.length > 0) {
      console.log(`Total inactive accounts deleted: ${inactiveUsers.length}`);
    }
    
  } catch (error) {
    console.error('Error deleting inactive accounts:', error);
  }
};

// Update habit statuses based on end dates
const updateHabitStatuses = async () => {
  try {
    const now = new Date();
    
    // Find habits that should be marked as completed or failed
    const habits = await Habit.find({
      status: 'active',
      endDate: { $lt: now }
    });
    
    for (const habit of habits) {
      const progress = habit.getProgress();
      
      // If completed 80% or more, mark as completed, otherwise failed
      if (progress.percentage >= 80) {
        habit.status = 'completed';
      } else {
        habit.status = 'failed';
      }
      
      await habit.save();
      console.log(`Updated habit status: ${habit.habitName} - ${habit.status}`);
    }
    
  } catch (error) {
    console.error('Error updating habit statuses:', error);
  }
};

// Reset daily learning statistics
const resetDailyLearningStats = async () => {
  try {
    const allProgress = await LearningProgress.find({});
    
    for (const progress of allProgress) {
      progress.resetDailyStats();
      await progress.save();
    }
    
    console.log('Daily learning statistics reset');
    
  } catch (error) {
    console.error('Error resetting daily stats:', error);
  }
};

// Initialize cron jobs
const initCronJobs = () => {
  // Run every day at 3 AM to delete inactive accounts
  cron.schedule('0 3 * * *', () => {
    console.log('Running scheduled task: Delete inactive accounts');
    deleteInactiveAccounts();
  });
  
  // Run every hour to update habit statuses
  cron.schedule('0 * * * *', () => {
    console.log('Running scheduled task: Update habit statuses');
    updateHabitStatuses();
  });
  
  // Run every day at midnight to reset daily learning stats
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled task: Reset daily learning stats');
    resetDailyLearningStats();
  });
  
  console.log('Cron jobs initialized');
};

module.exports = { initCronJobs };
