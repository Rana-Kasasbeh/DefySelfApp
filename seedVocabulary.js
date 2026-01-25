require('dotenv').config();
const mongoose = require('mongoose');
const Vocabulary = require('./models/Vocabulary');

/**
 * هذا السكريبت يضيف كلمات أولية للتجربة فقط (50 كلمة)
 * 
 * للاستخدام الفعلي مع 1500 كلمة:
 * استخدم: node importWords.js ./data/your-words.json
 * 
 * راجع ملف VOCABULARY_MANAGEMENT.md للتفاصيل
 */

// Sample vocabulary data - 50 words for testing only
const vocabularyData = [
  // Group 1 - Basic Common Words
  { wordId: 'word_001', word: 'Hello', translation: 'مرحبا', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Hello, how are you?', arabic: 'مرحبا، كيف حالك؟' }] },
  { wordId: 'word_002', word: 'Thank you', translation: 'شكراً', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Thank you very much', arabic: 'شكراً جزيلاً' }] },
  { wordId: 'word_003', word: 'Yes', translation: 'نعم', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Yes, I agree', arabic: 'نعم، أوافق' }] },
  { wordId: 'word_004', word: 'No', translation: 'لا', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'No, I don\'t think so', arabic: 'لا، لا أعتقد ذلك' }] },
  { wordId: 'word_005', word: 'Please', translation: 'من فضلك', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Please help me', arabic: 'ساعدني من فضلك' }] },
  { wordId: 'word_006', word: 'Sorry', translation: 'آسف', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'I am sorry', arabic: 'أنا آسف' }] },
  { wordId: 'word_007', word: 'Good', translation: 'جيد', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Good morning', arabic: 'صباح الخير' }] },
  { wordId: 'word_008', word: 'Bad', translation: 'سيء', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Bad weather', arabic: 'طقس سيء' }] },
  { wordId: 'word_009', word: 'Water', translation: 'ماء', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Drink water', arabic: 'اشرب الماء' }] },
  { wordId: 'word_010', word: 'Food', translation: 'طعام', category: 'basic', difficulty: 1, groupNumber: 1, examples: [{ english: 'Delicious food', arabic: 'طعام لذيذ' }] },

  // Group 2 - Daily Life
  { wordId: 'word_011', word: 'House', translation: 'منزل', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'My house is big', arabic: 'منزلي كبير' }] },
  { wordId: 'word_012', word: 'Family', translation: 'عائلة', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'I love my family', arabic: 'أحب عائلتي' }] },
  { wordId: 'word_013', word: 'Friend', translation: 'صديق', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'He is my friend', arabic: 'هو صديقي' }] },
  { wordId: 'word_014', word: 'Work', translation: 'عمل', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'I go to work', arabic: 'أذهب إلى العمل' }] },
  { wordId: 'word_015', word: 'School', translation: 'مدرسة', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'Children go to school', arabic: 'الأطفال يذهبون للمدرسة' }] },
  { wordId: 'word_016', word: 'Book', translation: 'كتاب', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'Read a book', arabic: 'اقرأ كتاباً' }] },
  { wordId: 'word_017', word: 'Phone', translation: 'هاتف', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'Mobile phone', arabic: 'هاتف محمول' }] },
  { wordId: 'word_018', word: 'Car', translation: 'سيارة', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'New car', arabic: 'سيارة جديدة' }] },
  { wordId: 'word_019', word: 'Time', translation: 'وقت', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'What time is it?', arabic: 'كم الساعة؟' }] },
  { wordId: 'word_020', word: 'Money', translation: 'مال', category: 'common', difficulty: 1, groupNumber: 2, examples: [{ english: 'Save money', arabic: 'وفر المال' }] },

  // Group 3 - Actions & Verbs
  { wordId: 'word_021', word: 'Go', translation: 'يذهب', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Let\'s go', arabic: 'لنذهب' }] },
  { wordId: 'word_022', word: 'Come', translation: 'يأتي', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Come here', arabic: 'تعال هنا' }] },
  { wordId: 'word_023', word: 'Eat', translation: 'يأكل', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Eat breakfast', arabic: 'تناول الإفطار' }] },
  { wordId: 'word_024', word: 'Drink', translation: 'يشرب', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Drink coffee', arabic: 'اشرب القهوة' }] },
  { wordId: 'word_025', word: 'Sleep', translation: 'ينام', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Sleep well', arabic: 'نم جيداً' }] },
  { wordId: 'word_026', word: 'Wake up', translation: 'يستيقظ', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Wake up early', arabic: 'استيقظ مبكراً' }] },
  { wordId: 'word_027', word: 'Walk', translation: 'يمشي', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Walk in the park', arabic: 'امشِ في الحديقة' }] },
  { wordId: 'word_028', word: 'Run', translation: 'يركض', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Run fast', arabic: 'اركض بسرعة' }] },
  { wordId: 'word_029', word: 'Study', translation: 'يدرس', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Study hard', arabic: 'ادرس بجد' }] },
  { wordId: 'word_030', word: 'Learn', translation: 'يتعلم', category: 'basic', difficulty: 2, groupNumber: 3, examples: [{ english: 'Learn English', arabic: 'تعلم الإنجليزية' }] },

  // Group 4 - Intermediate Words
  { wordId: 'word_031', word: 'Beautiful', translation: 'جميل', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Beautiful day', arabic: 'يوم جميل' }] },
  { wordId: 'word_032', word: 'Important', translation: 'مهم', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Very important', arabic: 'مهم جداً' }] },
  { wordId: 'word_033', word: 'Difficult', translation: 'صعب', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Difficult question', arabic: 'سؤال صعب' }] },
  { wordId: 'word_034', word: 'Easy', translation: 'سهل', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Easy task', arabic: 'مهمة سهلة' }] },
  { wordId: 'word_035', word: 'Happy', translation: 'سعيد', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'I am happy', arabic: 'أنا سعيد' }] },
  { wordId: 'word_036', word: 'Sad', translation: 'حزين', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Don\'t be sad', arabic: 'لا تكن حزيناً' }] },
  { wordId: 'word_037', word: 'Healthy', translation: 'صحي', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Healthy food', arabic: 'طعام صحي' }] },
  { wordId: 'word_038', word: 'Strong', translation: 'قوي', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Strong person', arabic: 'شخص قوي' }] },
  { wordId: 'word_039', word: 'Fast', translation: 'سريع', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Fast car', arabic: 'سيارة سريعة' }] },
  { wordId: 'word_040', word: 'Slow', translation: 'بطيء', category: 'intermediate', difficulty: 2, groupNumber: 4, examples: [{ english: 'Slow motion', arabic: 'حركة بطيئة' }] },

  // Group 5 - Advanced Words
  { wordId: 'word_041', word: 'Success', translation: 'نجاح', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Achieve success', arabic: 'حقق النجاح' }] },
  { wordId: 'word_042', word: 'Challenge', translation: 'تحدي', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Accept the challenge', arabic: 'اقبل التحدي' }] },
  { wordId: 'word_043', word: 'Improve', translation: 'يحسّن', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Improve yourself', arabic: 'حسّن نفسك' }] },
  { wordId: 'word_044', word: 'Achieve', translation: 'يحقق', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Achieve your goals', arabic: 'حقق أهدافك' }] },
  { wordId: 'word_045', word: 'Progress', translation: 'تقدم', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Make progress', arabic: 'أحرز تقدماً' }] },
  { wordId: 'word_046', word: 'Knowledge', translation: 'معرفة', category: 'academic', difficulty: 3, groupNumber: 5, examples: [{ english: 'Gain knowledge', arabic: 'اكتسب المعرفة' }] },
  { wordId: 'word_047', word: 'Wisdom', translation: 'حكمة', category: 'academic', difficulty: 3, groupNumber: 5, examples: [{ english: 'Words of wisdom', arabic: 'كلمات حكيمة' }] },
  { wordId: 'word_048', word: 'Patience', translation: 'صبر', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Have patience', arabic: 'تحلّ بالصبر' }] },
  { wordId: 'word_049', word: 'Discipline', translation: 'انضباط', category: 'intermediate', difficulty: 3, groupNumber: 5, examples: [{ english: 'Self-discipline', arabic: 'انضباط ذاتي' }] },
  { wordId: 'word_050', word: 'Excellence', translation: 'تميز', category: 'advanced', difficulty: 3, groupNumber: 5, examples: [{ english: 'Strive for excellence', arabic: 'اسعَ للتميز' }] }
];

const seedVocabulary = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');

    // Clear existing vocabulary
    await Vocabulary.deleteMany({});
    console.log('Cleared existing vocabulary data');

    // Insert new vocabulary
    await Vocabulary.insertMany(vocabularyData);
    console.log(`Successfully inserted ${vocabularyData.length} sample words`);

    // Show statistics
    const groups = await Vocabulary.aggregate([
      {
        $group: {
          _id: '$groupNumber',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Vocabulary Statistics:');
    groups.forEach(group => {
      console.log(`   Group ${group._id}: ${group.count} words`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ كلمات التجربة جاهزة!');
    console.log('='.repeat(60));
    console.log('\n📝 للاستخدام الفعلي مع كلماتك (1500+ كلمة):');
    console.log('   1. ضع كلماتك في ملف JSON (مثال: data/words.json)');
    console.log('   2. نفذ: node importWords.js ./data/words.json');
    console.log('   3. راجع ملف: VOCABULARY_MANAGEMENT.md للتفاصيل');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding vocabulary:', error);
    process.exit(1);
  }
};

// Run seed function
seedVocabulary();
