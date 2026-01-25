const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    unique: true,
    trim: true,
    minlength: [2, 'الاسم يجب أن يكون حرفين على الأقل']
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'البريد الإلكتروني غير صحيح']
  },
  age: {
    type: Number,
    required: [true, 'العمر مطلوب'],
    min: [13, 'يجب أن يكون العمر 13 سنة على الأقل'],
    max: [120, 'العمر غير صحيح']
  },
  password: {
    type: String,
    required: [true, 'كلمة السر مطلوبة'],
    minlength: [6, 'كلمة السر يجب أن تكون 6 أحرف على الأقل']
  },
  resetCode: {
    type: String,
    default: null
  },
  resetCodeExpiry: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  settings: {
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
