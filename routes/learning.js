const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');
const LearningProgress = require('../models/LearningProgress');
const Vocabulary = require('../models/Vocabulary');

// @route   GET /api/learning/progress
// @desc    Get user's learning progress
// @access  Private
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    let progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      // Create new progress for user
      progress = new LearningProgress({
        userId: req.user._id
      });
      await progress.save();
    }
    
    const groupProgress = progress.getCurrentGroupProgress();
    
    res.json({
      success: true,
      progress: {
        currentGroup: progress.currentGroup,
        totalWordsLearned: progress.totalWordsLearned,
        groupProgress,
        streak: progress.streak,
        statistics: progress.statistics
      }
    });
    
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/learning/words/current-group
// @desc    Get words for current group
// @access  Private
router.get('/words/current-group', authMiddleware, async (req, res) => {
  try {
    let progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      progress = new LearningProgress({
        userId: req.user._id
      });
      await progress.save();
    }
    
    // Get words from vocabulary for current group
    const words = await Vocabulary.getWordsByGroup(progress.currentGroup);
    
    // Mark which words have been learned
    const wordsWithStatus = words.map(word => {
      const learned = progress.learnedWords.find(lw => lw.wordId === word.wordId);
      return {
        ...word.toObject(),
        isLearned: !!learned,
        masteryLevel: learned ? learned.masteryLevel : 0
      };
    });
    
    res.json({
      success: true,
      groupNumber: progress.currentGroup,
      words: wordsWithStatus
    });
    
  } catch (error) {
    console.error('Get current group words error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   POST /api/learning/words/learn
// @desc    Mark word as learned
// @access  Private
router.post('/words/learn', authMiddleware, async (req, res) => {
  try {
    const { wordId, word, translation } = req.body;
    
    if (!wordId || !word || !translation) {
      return res.status(400).json({ 
        success: false,
        message: 'جميع بيانات الكلمة مطلوبة'
      });
    }
    
    let progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      progress = new LearningProgress({
        userId: req.user._id
      });
    }
    
    await progress.addLearnedWord({ wordId, word, translation });
    
    const groupProgress = progress.getCurrentGroupProgress();
    
    res.json({
      success: true,
      message: 'تم إضافة الكلمة بنجاح',
      progress: {
        currentGroup: progress.currentGroup,
        totalWordsLearned: progress.totalWordsLearned,
        groupProgress
      }
    });
    
  } catch (error) {
    console.error('Learn word error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   POST /api/learning/words/review
// @desc    Review a word
// @access  Private
router.post('/words/review', authMiddleware, async (req, res) => {
  try {
    const { wordId, correct } = req.body;
    
    if (!wordId || correct === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'بيانات المراجعة مطلوبة'
      });
    }
    
    const progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      return res.status(404).json({ 
        success: false,
        message: 'لم يتم العثور على تقدم التعلم'
      });
    }
    
    await progress.reviewWord(wordId, correct);
    
    res.json({
      success: true,
      message: correct ? 'إجابة صحيحة!' : 'حاول مرة أخرى',
      streak: progress.streak
    });
    
  } catch (error) {
    console.error('Review word error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/learning/words/review-list
// @desc    Get words that need review
// @access  Private
router.get('/words/review-list', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      return res.json({
        success: true,
        words: []
      });
    }
    
    const wordsForReview = progress.getWordsForReview(parseInt(limit));
    
    res.json({
      success: true,
      count: wordsForReview.length,
      words: wordsForReview
    });
    
  } catch (error) {
    console.error('Get review list error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/learning/learned-words
// @desc    Get all learned words
// @access  Private
router.get('/learned-words', authMiddleware, async (req, res) => {
  try {
    const { groupNumber } = req.query;
    
    const progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      return res.json({
        success: true,
        words: []
      });
    }
    
    let learnedWords = progress.learnedWords;
    
    if (groupNumber) {
      learnedWords = learnedWords.filter(w => w.groupNumber === parseInt(groupNumber));
    }
    
    res.json({
      success: true,
      count: learnedWords.length,
      words: learnedWords
    });
    
  } catch (error) {
    console.error('Get learned words error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   GET /api/learning/stats
// @desc    Get learning statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      return res.json({
        success: true,
        stats: {
          totalWordsLearned: 0,
          currentStreak: 0,
          longestStreak: 0,
          groupsCompleted: 0,
          averageAccuracy: 0
        }
      });
    }
    
    const groupsCompleted = progress.currentGroup - 1;
    
    res.json({
      success: true,
      stats: {
        totalWordsLearned: progress.totalWordsLearned,
        currentStreak: progress.streak.current,
        longestStreak: progress.streak.longest,
        groupsCompleted,
        averageAccuracy: progress.statistics.averageAccuracy,
        totalStudyTime: progress.statistics.totalStudyTime,
        wordsReviewedToday: progress.statistics.wordsReviewedToday
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// @route   POST /api/learning/daily-goal
// @desc    Update daily learning goal
// @access  Private
router.post('/daily-goal', authMiddleware, async (req, res) => {
  try {
    const { dailyGoal } = req.body;
    
    if (!dailyGoal || dailyGoal < 1 || dailyGoal > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'الهدف اليومي يجب أن يكون بين 1 و 100'
      });
    }
    
    let progress = await LearningProgress.findOne({ userId: req.user._id });
    
    if (!progress) {
      progress = new LearningProgress({
        userId: req.user._id,
        dailyGoal
      });
    } else {
      progress.dailyGoal = dailyGoal;
    }
    
    await progress.save();
    
    res.json({
      success: true,
      message: 'تم تحديث الهدف اليومي بنجاح',
      dailyGoal: progress.dailyGoal
    });
    
  } catch (error) {
    console.error('Update daily goal error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

module.exports = router;
