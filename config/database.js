const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ✅ إضافة خيارات الاتصال المهمة
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected - Attempting to reconnect...');
    });

    // ✅ إزالة SIGINT handler لتجنب الفصل التلقائي
    // process.on('SIGINT', async () => {
    //   await mongoose.connection.close();
    //   console.log('MongoDB connection closed through app termination');
    //   process.exit(0);
    // });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // ✅ إعادة المحاولة بعد 5 ثوان
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;