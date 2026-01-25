const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentGroup: {
    type: Number,
    default: 1
  },
  totalWordsLearned: {
    type: Number,
    default: 0
  },
  learnedWords: [{
    wordId: {
      type: String,
      required: true
    },
    word: {
      type: String,
      required: true
    },
    translation: {
      type: String,
      required: true
    },
    groupNumber: {
      type: Number,
      required: true
    },
    learnedAt: {
      type: Date,
      default: Date.now
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastReviewed: {
      type: Date
    },
    masteryLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 1
    }
  }],
  dailyGoal: {
    type: Number,
    default: 10
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date
    }
  },
  statistics: {
    totalStudyTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageAccuracy: {
      type: Number,
      default: 0 // percentage
    },
    wordsReviewedToday: {
      type: Number,
      default: 0
    }
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

// Method to add learned word
learningProgressSchema.methods.addLearnedWord = async function(wordData) {
  const existingWord = this.learnedWords.find(w => w.wordId === wordData.wordId);
  
  if (!existingWord) {
    this.learnedWords.push({
      wordId: wordData.wordId,
      word: wordData.word,
      translation: wordData.translation,
      groupNumber: this.currentGroup,
      learnedAt: new Date()
    });
    
    this.totalWordsLearned++;
    
    // Check if current group is complete (10 words)
    const currentGroupWords = this.learnedWords.filter(w => w.groupNumber === this.currentGroup);
    if (currentGroupWords.length >= 10) {
      this.currentGroup++;
    }
    
    this.updateStreak();
    await this.save();
  }
  
  return this;
};

// Method to review word
learningProgressSchema.methods.reviewWord = async function(wordId, correct) {
  const word = this.learnedWords.find(w => w.wordId === wordId);
  
  if (word) {
    word.reviewCount++;
    word.lastReviewed = new Date();
    
    // Update mastery level based on correctness
    if (correct) {
      word.masteryLevel = Math.min(5, word.masteryLevel + 1);
    } else {
      word.masteryLevel = Math.max(1, word.masteryLevel - 1);
    }
    
    this.statistics.wordsReviewedToday++;
    this.updateStreak();
    
    await this.save();
  }
  
  return this;
};

// Method to update streak
learningProgressSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.streak.lastStudyDate) {
    const lastStudy = new Date(this.streak.lastStudyDate);
    lastStudy.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, do nothing
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      this.streak.current++;
      this.streak.longest = Math.max(this.streak.longest, this.streak.current);
    } else {
      // Streak broken
      this.streak.current = 1;
    }
  } else {
    // First time studying
    this.streak.current = 1;
    this.streak.longest = 1;
  }
  
  this.streak.lastStudyDate = today;
};

// Method to get progress for current group
learningProgressSchema.methods.getCurrentGroupProgress = function() {
  const currentGroupWords = this.learnedWords.filter(w => w.groupNumber === this.currentGroup);
  
  return {
    groupNumber: this.currentGroup,
    wordsLearned: currentGroupWords.length,
    wordsRemaining: 10 - currentGroupWords.length,
    totalWordsLearned: this.totalWordsLearned
  };
};

// Method to get words for review (based on spaced repetition)
learningProgressSchema.methods.getWordsForReview = function(limit = 10) {
  const now = new Date();
  
  return this.learnedWords
    .filter(word => {
      if (!word.lastReviewed) return true;
      
      const hoursSinceReview = (now - word.lastReviewed) / (1000 * 60 * 60);
      const reviewInterval = Math.pow(2, word.masteryLevel); // Exponential spacing
      
      return hoursSinceReview >= reviewInterval;
    })
    .sort((a, b) => {
      const aScore = (a.lastReviewed ? now - a.lastReviewed : Infinity) / a.masteryLevel;
      const bScore = (b.lastReviewed ? now - b.lastReviewed : Infinity) / b.masteryLevel;
      return bScore - aScore;
    })
    .slice(0, limit);
};

// Reset daily statistics (should be called by cron job)
learningProgressSchema.methods.resetDailyStats = function() {
  this.statistics.wordsReviewedToday = 0;
};

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
