const mongoose = require('mongoose');

const waterTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: [30, 'الوزن يجب أن يكون 30 كجم على الأقل']
  },
  activityLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'medium'
  },
  weatherCondition: {
    type: String,
    enum: ['cold', 'moderate', 'hot'],
    required: true,
    default: 'moderate'
  },
  dailyWaterGoal: {
    type: Number,
    required: true
  },
  glassesConsumed: {
    type: Number,
    default: 0
  },
  glassSize: {
    type: Number,
    default: 250 // ml
  },
  date: {
    type: Date,
    default: Date.now
  },
  healthTips: [{
    type: String
  }],
  notificationTimes: [{
    type: String // Format: "HH:MM"
  }],
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

// Create compound index for userId and date
waterTrackingSchema.index({ userId: 1, date: 1 });

// Method to calculate daily water goal
waterTrackingSchema.statics.calculateWaterGoal = function(weight, activityLevel, weatherCondition) {
  let baseWater = weight * 30; // ml per kg
  
  // Activity level multiplier
  const activityMultiplier = {
    'low': 1.0,
    'medium': 1.2,
    'high': 1.5
  };
  
  // Weather condition multiplier
  const weatherMultiplier = {
    'cold': 0.9,
    'moderate': 1.0,
    'hot': 1.3
  };
  
  const totalWater = baseWater * activityMultiplier[activityLevel] * weatherMultiplier[weatherCondition];
  
  return Math.round(totalWater);
};

// Method to get health tips based on consumption
waterTrackingSchema.methods.getHealthTips = function() {
  const percentage = (this.glassesConsumed * this.glassSize / this.dailyWaterGoal) * 100;
  
  const tips = [];
  
  if (percentage < 30) {
    tips.push('ابدأ يومك بشرب كوب ماء على الريق');
    tips.push('اشرب الماء قبل الوجبات بـ 30 دقيقة');
  } else if (percentage < 60) {
    tips.push('أنت في منتصف الطريق، استمر!');
    tips.push('اجعل زجاجة الماء قريبة منك دائماً');
  } else if (percentage < 100) {
    tips.push('أداء رائع! أنت قريب من هدفك اليومي');
    tips.push('شرب الماء يحسن من وظائف الدماغ والتركيز');
  } else {
    tips.push('ممتاز! لقد حققت هدفك اليومي');
    tips.push('شرب الماء بانتظام يعزز صحة البشرة والجسم');
  }
  
  return tips;
};

module.exports = mongoose.model('WaterTracking', waterTrackingSchema);
