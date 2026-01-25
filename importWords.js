require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Vocabulary = require('./models/Vocabulary');

/**
 * هذا السكريبت يستورد الكلمات من ملف JSON
 * 
 * الاستخدام:
 * node importWords.js <path-to-json-file> [options]
 * 
 * الخيارات:
 * --clear : حذف جميع الكلمات الموجودة قبل الاستيراد
 * --update : تحديث الكلمات الموجودة بدلاً من تجاهلها
 * 
 * مثال:
 * node importWords.js ./data/words.json
 * node importWords.js ./data/words.json --clear
 * node importWords.js ./data/words.json --update
 */

const importWords = async () => {
  try {
    // الحصول على مسار الملف من arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('❌ يرجى تحديد مسار ملف JSON');
      console.log('الاستخدام: node importWords.js <path-to-json-file> [--clear] [--update]');
      process.exit(1);
    }
    
    const filePath = args[0];
    const clearExisting = args.includes('--clear');
    const updateExisting = args.includes('--update');
    
    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      console.error(`❌ الملف غير موجود: ${filePath}`);
      process.exit(1);
    }
    
    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // قراءة ملف JSON
    console.log(`📖 جاري قراءة الملف: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let words;
    
    try {
      words = JSON.parse(fileContent);
    } catch (error) {
      console.error('❌ خطأ في قراءة ملف JSON:', error.message);
      process.exit(1);
    }
    
    if (!Array.isArray(words)) {
      console.error('❌ يجب أن يحتوي الملف على مصفوفة من الكلمات');
      process.exit(1);
    }
    
    console.log(`📊 عدد الكلمات في الملف: ${words.length}`);
    
    // حذف الكلمات الموجودة إذا طُلب
    if (clearExisting) {
      console.log('🗑️  جاري حذف الكلمات الموجودة...');
      const deletedCount = await Vocabulary.deleteMany({});
      console.log(`✅ تم حذف ${deletedCount.deletedCount} كلمة`);
    }
    
    // استيراد الكلمات
    console.log('📥 جاري استيراد الكلمات...');
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = [];
    
    for (let i = 0; i < words.length; i++) {
      const wordData = words[i];
      
      // عرض التقدم كل 100 كلمة
      if ((i + 1) % 100 === 0) {
        console.log(`📊 تقدم: ${i + 1}/${words.length}`);
      }
      
      try {
        // التحقق من الحقول المطلوبة
        if (!wordData.wordId || !wordData.word || !wordData.translation) {
          errors.push({
            index: i + 1,
            wordId: wordData.wordId || 'unknown',
            error: 'بيانات ناقصة (wordId, word, translation مطلوبة)'
          });
          continue;
        }
        
        const existingWord = await Vocabulary.findOne({ wordId: wordData.wordId });
        
        if (existingWord) {
          if (updateExisting) {
            // تحديث الكلمة الموجودة
            existingWord.word = wordData.word;
            existingWord.translation = wordData.translation;
            existingWord.pronunciation = wordData.pronunciation || existingWord.pronunciation;
            existingWord.category = wordData.category || existingWord.category;
            existingWord.difficulty = wordData.difficulty || existingWord.difficulty;
            existingWord.groupNumber = wordData.groupNumber || existingWord.groupNumber;
            existingWord.examples = wordData.examples || existingWord.examples;
            existingWord.synonyms = wordData.synonyms || existingWord.synonyms;
            existingWord.antonyms = wordData.antonyms || existingWord.antonyms;
            
            if (wordData.isActive !== undefined) {
              existingWord.isActive = wordData.isActive;
            }
            
            await existingWord.save();
            updated++;
          } else {
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
          index: i + 1,
          wordId: wordData.wordId,
          error: err.message
        });
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ملخص الاستيراد:');
    console.log('='.repeat(50));
    console.log(`✅ تم استيراد: ${imported} كلمة`);
    console.log(`🔄 تم تحديث: ${updated} كلمة`);
    console.log(`⏭️  تم تجاهل: ${skipped} كلمة (موجودة مسبقاً)`);
    console.log(`❌ أخطاء: ${errors.length}`);
    console.log('='.repeat(50));
    
    // عرض الأخطاء إذا وُجدت
    if (errors.length > 0) {
      console.log('\n⚠️  قائمة الأخطاء (أول 20):');
      errors.slice(0, 20).forEach(err => {
        console.log(`   - السطر ${err.index}: ${err.wordId} - ${err.error}`);
      });
      
      if (errors.length > 20) {
        console.log(`   ... و ${errors.length - 20} خطأ آخر`);
      }
    }
    
    // الإحصائيات النهائية
    console.log('\n📈 إحصائيات قاعدة البيانات:');
    const totalWords = await Vocabulary.countDocuments({ isActive: true });
    console.log(`   إجمالي الكلمات النشطة: ${totalWords}`);
    
    const groups = await Vocabulary.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$groupNumber',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n   توزيع المجموعات:');
    groups.forEach(group => {
      console.log(`   المجموعة ${group._id}: ${group.count} كلمة`);
    });
    
    console.log('\n✨ تم الانتهاء بنجاح!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ حدث خطأ:', error);
    process.exit(1);
  }
};

// تشغيل الاستيراد
importWords();
