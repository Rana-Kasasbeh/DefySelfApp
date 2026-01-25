// scripts/importVocabulary.js - IMPORT 1500 WORDS FROM JSON
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Vocabulary model
const Vocabulary = require('../models/Vocabulary');

// ==================== IMPORT FUNCTION ====================
async function importVocabulary() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read JSON file
    console.log('📖 Reading JSON file...');
    const jsonPath = path.join(__dirname, '../data/vocabulary.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`❌ JSON file not found at: ${jsonPath}`);
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const words = JSON.parse(jsonData);

    console.log(`📊 Found ${words.length} words in JSON file`);

    // Clear existing data (optional - uncomment if you want to clear)
    // console.log('🗑️  Clearing existing vocabulary...');
    // await Vocabulary.deleteMany({});
    // console.log('✅ Cleared existing vocabulary');

    // Import words
    console.log('📥 Importing words...');
    
    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (let i = 0; i < words.length; i++) {
      const wordData = words[i];
      
      try {
        // Check if word already exists
        const exists = await Vocabulary.findOne({ wordId: wordData.wordId });
        
        if (exists) {
          skipped++;
          continue;
        }

        // Create new word
        const newWord = new Vocabulary({
          wordId: wordData.wordId,
          word: wordData.word,
          translation: wordData.translation,
          pronunciation: wordData.pronunciation || '',
          category: wordData.category || 'basic',
          difficulty: wordData.difficulty || 1,
          groupNumber: wordData.groupNumber || Math.ceil((i + 1) / 50), // Auto-calculate group (50 words per group)
          examples: wordData.examples || [],
          synonyms: wordData.synonyms || [],
          antonyms: wordData.antonyms || [],
          isActive: true
        });

        await newWord.save();
        imported++;

        // Progress indicator
        if (imported % 100 === 0) {
          console.log(`   ⏳ Imported ${imported} words...`);
        }

      } catch (error) {
        errors.push({
          wordId: wordData.wordId,
          error: error.message
        });
      }
    }

    // Final statistics
    console.log('\n✅ Import completed!');
    console.log(`📊 Statistics:`);
    console.log(`   • Total words in JSON: ${words.length}`);
    console.log(`   • Successfully imported: ${imported}`);
    console.log(`   • Skipped (duplicates): ${skipped}`);
    console.log(`   • Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ First 10 errors:');
      errors.slice(0, 10).forEach(err => {
        console.log(`   • ${err.wordId}: ${err.error}`);
      });
    }

    // Get group statistics
    const groupStats = await Vocabulary.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$groupNumber',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📚 Groups created:');
    groupStats.forEach(group => {
      console.log(`   • Group ${group._id}: ${group.count} words`);
    });

    console.log('\n🎉 All done!\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// ==================== RUN IMPORT ====================
importVocabulary();
