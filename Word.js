const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  word: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  translation: {
    type: String,
    required: true,
    trim: true
  },
  learned: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'general',
    enum: ['general', 'animals', 'colors', 'numbers', 'verbs', 'adjectives', 'food', 'nature', 'technology', 'education', 'family', 'body', 'clothes', 'time', 'places']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  example: {
    type: String,
    trim: true
  },
  pronunciation: {
    type: String,
    trim: true
  },
  partOfSpeech: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'],
    default: 'noun'
  },
  synonyms: [{
    type: String,
    trim: true
  }],
  antonyms: [{
    type: String,
    trim: true
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  lastReviewed: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes للبحث السريع
wordSchema.index({ word: 1 });
wordSchema.index({ category: 1 });
wordSchema.index({ difficulty: 1 });
wordSchema.index({ learned: 1 });

// Virtual للحصول على عدد المراجعات
wordSchema.virtual('reviewCount').get(function() {
  return this.usageCount;
});

// Method لتحديث حالة التعلم
wordSchema.methods.markAsLearned = function() {
  this.learned = true;
  this.lastReviewed = new Date();
  return this.save();
};

// Method لزيادة عدد الاستخدام
wordSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastReviewed = new Date();
  return this.save();
};

// Static method للحصول على كلمات عشوائية
wordSchema.statics.getRandomWords = async function(count = 10, category = null, difficulty = null) {
  const query = {};
  
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  
  const words = await this.aggregate([
    { $match: query },
    { $sample: { size: count } }
  ]);
  
  return words;
};

// Static method للحصول على كلمات غير متعلمة
wordSchema.statics.getUnlearnedWords = async function(limit = 20) {
  return this.find({ learned: false })
    .limit(limit)
    .sort({ id: 1 });
};

// Static method للإحصائيات
wordSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const learned = await this.countDocuments({ learned: true });
  const unlearned = await this.countDocuments({ learned: false });
  
  const byCategory = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        learned: {
          $sum: { $cond: ['$learned', 1, 0] }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        total: '$count',
        learned: 1,
        unlearned: { $subtract: ['$count', '$learned'] },
        _id: 0
      }
    }
  ]);
  
  return {
    total,
    learned,
    unlearned,
    percentage: total > 0 ? Math.round((learned / total) * 100) : 0,
    byCategory
  };
};

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;