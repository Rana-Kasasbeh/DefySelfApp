const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habitName: {
    type: String,
    required: [true, 'اسم العادة مطلوب'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'مدة العادة مطلوبة'],
    min: [1, 'المدة يجب أن تكون يوم واحد على الأقل']
  },
  durationUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    default: 'days'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'paused'],
    default: 'active'
  },
  reminderTime: {
    type: String // Format: "HH:MM"
  },
  completedDays: [{
    date: {
      type: Date
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String
    }
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    }
  },
  category: {
    type: String,
    enum: ['health', 'productivity', 'learning', 'fitness', 'mindfulness', 'other'],
    default: 'other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
habitSchema.index({ userId: 1, status: 1 });
habitSchema.index({ userId: 1, createdAt: -1 });

// Calculate end date before saving
habitSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('duration')) {
    const start = new Date(this.startDate);
    let endDate = new Date(start);
    
    switch(this.durationUnit) {
      case 'days':
        endDate.setDate(start.getDate() + this.duration);
        break;
      case 'weeks':
        endDate.setDate(start.getDate() + (this.duration * 7));
        break;
      case 'months':
        endDate.setMonth(start.getMonth() + this.duration);
        break;
    }
    
    this.endDate = endDate;
  }
  next();
});

// Method to mark day as completed
habitSchema.methods.markDayCompleted = async function(date, notes = '') {
  const dayEntry = this.completedDays.find(d => 
    d.date.toDateString() === new Date(date).toDateString()
  );
  
  if (dayEntry) {
    dayEntry.completed = true;
    dayEntry.notes = notes;
  } else {
    this.completedDays.push({
      date: new Date(date),
      completed: true,
      notes: notes
    });
  }
  
  this.calculateStreak();
  await this.save();
};

// Method to calculate streak
habitSchema.methods.calculateStreak = function() {
  if (this.completedDays.length === 0) {
    this.streak.current = 0;
    return;
  }
  
  const sortedDays = this.completedDays
    .filter(d => d.completed)
    .sort((a, b) => b.date - a.date);
  
  if (sortedDays.length === 0) {
    this.streak.current = 0;
    return;
  }
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastCompleted = new Date(sortedDays[0].date);
  lastCompleted.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) {
    currentStreak = 1;
    
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const current = new Date(sortedDays[i].date);
      const next = new Date(sortedDays[i + 1].date);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }
  
  this.streak.current = currentStreak;
  this.streak.longest = Math.max(this.streak.longest, currentStreak);
};

// Method to get progress percentage
habitSchema.methods.getProgress = function() {
  const totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  const completedCount = this.completedDays.filter(d => d.completed).length;
  
  return {
    totalDays,
    completedDays: completedCount,
    percentage: Math.round((completedCount / totalDays) * 100)
  };
};

module.exports = mongoose.model('Habit', habitSchema);
