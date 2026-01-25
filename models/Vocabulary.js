// models/Vocabulary.js - UPDATED TO MATCH JSON STRUCTURE
const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  // Unique identifier for each word
  wordId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // English word
  word: {
    type: String,
    required: true,
    trim: true
  },
  
  // Arabic translation
  translation: {
    type: String,
    required: true,
    trim: true
  },
  
  // Pronunciation (optional)
  pronunciation: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Category of the word
  category: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'common', 'business', 'travel', 'academic', 'general'],
    default: 'basic'
  },
  
  // Difficulty level (1-5)
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  
  // Example sentences (array of objects with English and Arabic)
  examples: [{
    english: {
      type: String,
      trim: true
    },
    arabic: {
      type: String,
      trim: true
    }
  }],
  
  // Synonyms (array of strings)
  synonyms: [{
    type: String,
    trim: true
  }],
  
  // Antonyms (array of strings)
  antonyms: [{
    type: String,
    trim: true
  }],
  
  // Group number (for organizing words into groups of 50)
  groupNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Active status (for soft delete)
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Creation date
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// ==================== INDEXES ====================
// Index for efficient querying by group
vocabularySchema.index({ groupNumber: 1, isActive: 1 });

// Index for category and difficulty
vocabularySchema.index({ category: 1, difficulty: 1 });

// Index for word search
vocabularySchema.index({ word: 1 });
vocabularySchema.index({ translation: 1 });

// Compound index for active words in a specific group
vocabularySchema.index({ groupNumber: 1, isActive: 1, wordId: 1 });

// ==================== STATIC METHODS ====================

// Get words by group number (returns 50 words per group)
vocabularySchema.statics.getWordsByGroup = async function(groupNumber) {
  return await this.find({ 
    groupNumber: groupNumber,
    isActive: true 
  })
  .sort({ wordId: 1 })
  .limit(50); // Each group has up to 50 words
};

// Get random words for practice
vocabularySchema.statics.getRandomWords = async function(count = 10, category = null) {
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }
  
  const words = await this.aggregate([
    { $match: query },
    { $sample: { size: count } }
  ]);
  
  return words;
};

// Get total number of groups
vocabularySchema.statics.getTotalGroups = async function() {
  const result = await this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$groupNumber' } },
    { $sort: { _id: 1 } }
  ]);
  
  return result.length;
};

// Get statistics by category
vocabularySchema.statics.getStatsByCategory = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgDifficulty: { $avg: '$difficulty' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Search words (by English or Arabic)
vocabularySchema.statics.searchWords = async function(searchTerm, limit = 20) {
  const regex = new RegExp(searchTerm, 'i'); // Case-insensitive search
  
  return await this.find({
    isActive: true,
    $or: [
      { word: regex },
      { translation: regex }
    ]
  })
  .limit(limit)
  .sort({ groupNumber: 1, wordId: 1 });
};

// Get words by difficulty
vocabularySchema.statics.getWordsByDifficulty = async function(difficulty, limit = 50) {
  return await this.find({
    isActive: true,
    difficulty: difficulty
  })
  .limit(limit)
  .sort({ groupNumber: 1, wordId: 1 });
};

// ==================== INSTANCE METHODS ====================

// Format word for API response
vocabularySchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Remove MongoDB internal fields
  delete obj.__v;
  delete obj.updatedAt;
  
  return obj;
};

// ==================== EXPORT ====================
module.exports = mongoose.model('Vocabulary', vocabularySchema);