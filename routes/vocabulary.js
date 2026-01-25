const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');
const Vocabulary = require('../models/Vocabulary');

// @route   POST /api/vocabulary/bulk-upload
// @desc    Upload multiple words at once from JSON
// @access  Public (يمكن تقييده للأدمن فقط لاحقاً)
router.post('/bulk-upload', async (req, res) => {
  try {
    const { words, clearExisting } = req.body;
    
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'يجب إرسال مصفوفة من الكلمات'
      });
    }
    
    // حذف الكلمات الموجودة إذا طُلب ذلك
    if (clearExisting === true) {
      await Vocabulary.deleteMany({});
      console.log('Cleared existing vocabulary');
    }
    
    // إضافة الكلمات الجديدة
    const inserted = await Vocabulary.insertMany(words, { ordered: false });
    
    // حساب الإحصائيات
    const stats = await Vocabulary.aggregate([
      {
        $group: {
          _id: '$groupNumber',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      message: `تم إضافة ${inserted.length} كلمة بنجاح`,
      totalWords: inserted.length,
      groups: stats
    });
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    
    // التعامل مع الكلمات المكررة
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'بعض الكلمات موجودة مسبقاً',
        error: 'بعض الكلمات لها wordId مكرر'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في رفع الكلمات'
    });
  }
});

// @route   POST /api/vocabulary/add-word
// @desc    Add single word
// @access  Public (يمكن تقييده للأدمن فقط لاحقاً)
router.post('/add-word', async (req, res) => {
  try {
    const { wordId, word, translation, pronunciation, category, difficulty, groupNumber, examples, synonyms, antonyms } = req.body;
    
    if (!wordId || !word || !translation || !groupNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'wordId, word, translation, و groupNumber مطلوبة'
      });
    }
    
    // التحقق من عدم وجود الكلمة
    const existingWord = await Vocabulary.findOne({ wordId });
    if (existingWord) {
      return res.status(400).json({ 
        success: false,
        message: 'هذه الكلمة موجودة مسبقاً'
      });
    }
    
    const newWord = new Vocabulary({
      wordId,
      word,
      translation,
      pronunciation,
      category: category || 'basic',
      difficulty: difficulty || 1,
      groupNumber,
      examples: examples || [],
      synonyms: synonyms || [],
      antonyms: antonyms || []
    });
    
    await newWord.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الكلمة بنجاح',
      word: newWord
    });
    
  } catch (error) {
    console.error('Add word error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في إضافة الكلمة'
    });
  }
});

// @route   PUT /api/vocabulary/update-word/:wordId
// @desc    Update existing word
// @access  Public (يمكن تقييده للأدمن فقط لاحقاً)
router.put('/update-word/:wordId', async (req, res) => {
  try {
    const { wordId } = req.params;
    const updateData = req.body;
    
    const word = await Vocabulary.findOne({ wordId });
    
    if (!word) {
      return res.status(404).json({ 
        success: false,
        message: 'الكلمة غير موجودة'
      });
    }
    
    // تحديث الحقول المسموح بها
    const allowedFields = ['word', 'translation', 'pronunciation', 'category', 'difficulty', 'groupNumber', 'examples', 'synonyms', 'antonyms', 'isActive'];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        word[field] = updateData[field];
      }
    });
    
    await word.save();
    
    res.json({
      success: true,
      message: 'تم تحديث الكلمة بنجاح',
      word
    });
    
  } catch (error) {
    console.error('Update word error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في تحديث الكلمة'
    });
  }
});

// @route   DELETE /api/vocabulary/delete-word/:wordId
// @desc    Delete word
// @access  Public (يمكن تقييده للأدمن فقط لاحقاً)
router.delete('/delete-word/:wordId', async (req, res) => {
  try {
    const { wordId } = req.params;
    
    const word = await Vocabulary.findOneAndDelete({ wordId });
    
    if (!word) {
      return res.status(404).json({ 
        success: false,
        message: 'الكلمة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف الكلمة بنجاح'
    });
    
  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في حذف الكلمة'
    });
  }
});

// @route   GET /api/vocabulary/all-words
// @desc    Get all words with pagination
// @access  Public
router.get('/all-words', async (req, res) => {
  try {
    const { page = 1, limit = 50, groupNumber, category, search } = req.query;
    
    const query = { isActive: true };
    
    if (groupNumber) {
      query.groupNumber = parseInt(groupNumber);
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { translation: { $regex: search, $options: 'i' } }
      ];
    }
    
    const words = await Vocabulary.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ groupNumber: 1, wordId: 1 });
    
    const total = await Vocabulary.countDocuments(query);
    
    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      words
    });
    
  } catch (error) {
    console.error('Get all words error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في جلب الكلمات'
    });
  }
});

// @route   GET /api/vocabulary/groups
// @desc    Get all groups with statistics
// @access  Public
router.get('/groups', async (req, res) => {
  try {
    const groups = await Vocabulary.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$groupNumber',
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const totalWords = await Vocabulary.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      totalWords,
      totalGroups: groups.length,
      groups: groups.map(g => ({
        groupNumber: g._id,
        wordsCount: g.count,
        categories: g.categories
      }))
    });
    
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في جلب المجموعات'
    });
  }
});

// @route   GET /api/vocabulary/stats
// @desc    Get vocabulary statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await Vocabulary.aggregate([
      { $match: { isActive: true } },
      {
        $facet: {
          byGroup: [
            {
              $group: {
                _id: '$groupNumber',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          byDifficulty: [
            {
              $group: {
                _id: '$difficulty',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);
    
    const totalWords = await Vocabulary.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      totalWords,
      statistics: stats[0]
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في جلب الإحصائيات'
    });
  }
});

// @route   POST /api/vocabulary/import-from-json
// @desc    Import words from JSON file structure
// @access  Public
router.post('/import-from-json', async (req, res) => {
  try {
    const { words, options } = req.body;
    
    if (!Array.isArray(words)) {
      return res.status(400).json({ 
        success: false,
        message: 'يجب إرسال مصفوفة من الكلمات'
      });
    }
    
    // خيارات الاستيراد
    const {
      clearExisting = false,
      skipDuplicates = true,
      updateExisting = false
    } = options || {};
    
    // حذف الكلمات الموجودة إذا طُلب
    if (clearExisting) {
      await Vocabulary.deleteMany({});
    }
    
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let errors = [];
    
    for (const wordData of words) {
      try {
        // التحقق من الحقول المطلوبة
        if (!wordData.wordId || !wordData.word || !wordData.translation) {
          errors.push({ wordId: wordData.wordId || 'unknown', error: 'بيانات ناقصة' });
          continue;
        }
        
        const existingWord = await Vocabulary.findOne({ wordId: wordData.wordId });
        
        if (existingWord) {
          if (updateExisting) {
            // تحديث الكلمة الموجودة
            Object.assign(existingWord, wordData);
            await existingWord.save();
            updated++;
          } else if (skipDuplicates) {
            skipped++;
          }
        } else {
          // إضافة كلمة جديدة
          const newWord = new Vocabulary({
            wordId: wordData.wordId,
            word: wordData.word,
            translation: wordData.translation,
            pronunciation: wordData.pronunciation || '',
            category: wordData.category || 'basic',
            difficulty: wordData.difficulty || 1,
            groupNumber: wordData.groupNumber || 1,
            examples: wordData.examples || [],
            synonyms: wordData.synonyms || [],
            antonyms: wordData.antonyms || [],
            isActive: wordData.isActive !== undefined ? wordData.isActive : true
          });
          
          await newWord.save();
          imported++;
        }
        
      } catch (err) {
        errors.push({ 
          wordId: wordData.wordId, 
          error: err.message 
        });
      }
    }
    
    res.json({
      success: true,
      message: 'تم استيراد الكلمات',
      summary: {
        total: words.length,
        imported,
        updated,
        skipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [] // عرض أول 10 أخطاء فقط
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في استيراد الكلمات'
    });
  }
});

module.exports = router;
