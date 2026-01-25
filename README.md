# DefySelf App - Backend API

Backend API server for DefySelf mobile application built with Node.js, Express, MongoDB, and Nodemailer.

## 📋 المتطلبات

- Node.js (v14 أو أحدث)
- MongoDB (v4.4 أو أحدث)
- npm أو yarn

## 🚀 التثبيت والإعداد

### 1. تثبيت المكتبات

```bash
npm install
```

### 2. إعداد ملف البيئة

أنسخ ملف `.env.example` إلى `.env` وقم بتعبئة البيانات:

```bash
cp .env.example .env
```

### 3. تعديل ملف .env

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/defyself
# أو استخدم MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/defyself

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Email Configuration (مثال Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. إضافة بيانات الكلمات الأولية

```bash
node seedVocabulary.js
```

### 5. تشغيل الخادم

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 هيكل المشروع

```
defy-self-backend/
├── config/
│   └── database.js          # إعدادات قاعدة البيانات
├── models/
│   ├── User.js              # نموذج المستخدم
│   ├── WaterTracking.js     # نموذج متابعة الماء
│   ├── Habit.js             # نموذج العادات
│   ├── LearningProgress.js  # نموذج تقدم التعلم
│   └── Vocabulary.js        # نموذج الكلمات
├── routes/
│   ├── auth.js              # مسارات التوثيق
│   ├── user.js              # مسارات المستخدم
│   ├── water.js             # مسارات الماء
│   ├── habits.js            # مسارات العادات
│   └── learning.js          # مسارات التعلم
├── utils/
│   ├── authMiddleware.js    # Middleware للمصادقة
│   └── cronJobs.js          # المهام المجدولة
├── .env.example             # مثال ملف البيئة
├── package.json
├── seedVocabulary.js        # ملف إضافة الكلمات
└── server.js                # الملف الرئيسي
```

## 🔌 API Endpoints

### 🔐 Authentication (`/api/auth`)

#### إنشاء حساب جديد
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "age": 25,
  "password": "password123"
}
```

**الشروط:**
- الاسم: على الأقل حرفين، غير مكرر
- البريد الإلكتروني: صالح وغير مكرر
- العمر: بين 13 و 120
- كلمة السر: 6 أحرف على الأقل

#### تسجيل الدخول
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

#### نسيت كلمة السر - إرسال كود
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "ahmed@example.com"
}
```

**ملاحظة:** يتم إرسال كود من 6 أرقام صالح لمدة دقيقتين

#### التحقق من الكود
```http
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "code": "123456"
}
```

#### إعادة تعيين كلمة السر
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

### 👤 User Management (`/api/user`)

جميع المسارات تتطلب Authentication Token في الـ Header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### الحصول على الملف الشخصي
```http
GET /api/user/profile
```

#### تحديث الإعدادات
```http
PUT /api/user/settings
Content-Type: application/json

{
  "soundEnabled": true,
  "notificationsEnabled": true
}
```

#### تحديث الملف الشخصي
```http
PUT /api/user/profile
Content-Type: application/json

{
  "name": "أحمد محمود",
  "age": 26
}
```

#### حذف الحساب
```http
DELETE /api/user/account
```

### 💧 Water Tracking (`/api/water`)

#### إعداد متابعة الماء
```http
POST /api/water/setup
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "weight": 75,
  "activityLevel": "medium",
  "weatherCondition": "hot"
}
```

**activityLevel:** `low` | `medium` | `high`  
**weatherCondition:** `cold` | `moderate` | `hot`

#### الحصول على بيانات اليوم
```http
GET /api/water/today
Authorization: Bearer YOUR_JWT_TOKEN
```

#### إضافة كأس ماء
```http
POST /api/water/add-glass
Authorization: Bearer YOUR_JWT_TOKEN
```

#### السجل التاريخي
```http
GET /api/water/history?days=7
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تحديث أوقات التذكير
```http
PUT /api/water/notification-times
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "notificationTimes": ["08:00", "12:00", "16:00", "20:00"]
}
```

### 🎯 Habits (`/api/habits`)

#### إنشاء عادة جديدة
```http
POST /api/habits
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "habitName": "قراءة يومية",
  "description": "قراءة 30 صفحة يومياً",
  "duration": 30,
  "durationUnit": "days",
  "category": "learning",
  "reminderTime": "20:00"
}
```

**category:** `health` | `productivity` | `learning` | `fitness` | `mindfulness` | `other`  
**durationUnit:** `days` | `weeks` | `months`

#### الحصول على جميع العادات
```http
GET /api/habits?status=active
Authorization: Bearer YOUR_JWT_TOKEN
```

**status (optional):** `active` | `completed` | `failed` | `paused`

#### الحصول على عادة معينة
```http
GET /api/habits/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تحديث عادة
```http
PUT /api/habits/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "habitName": "قراءة يومية محسنة",
  "duration": 45,
  "status": "active"
}
```

#### حذف عادة
```http
DELETE /api/habits/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تسجيل يوم مكتمل
```http
POST /api/habits/:id/mark-day
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "date": "2024-01-24",
  "notes": "أكملت القراءة بنجاح"
}
```

#### إحصائيات العادات
```http
GET /api/habits/stats/overview
Authorization: Bearer YOUR_JWT_TOKEN
```

### 📚 Learning (`/api/learning`)

#### الحصول على التقدم
```http
GET /api/learning/progress
Authorization: Bearer YOUR_JWT_TOKEN
```

#### كلمات المجموعة الحالية
```http
GET /api/learning/words/current-group
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تسجيل كلمة كمتعلمة
```http
POST /api/learning/words/learn
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "wordId": "word_001",
  "word": "Hello",
  "translation": "مرحبا"
}
```

#### مراجعة كلمة
```http
POST /api/learning/words/review
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "wordId": "word_001",
  "correct": true
}
```

#### قائمة الكلمات للمراجعة
```http
GET /api/learning/words/review-list?limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### الكلمات المتعلمة
```http
GET /api/learning/learned-words?groupNumber=1
Authorization: Bearer YOUR_JWT_TOKEN
```

#### إحصائيات التعلم
```http
GET /api/learning/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تحديث الهدف اليومي
```http
POST /api/learning/daily-goal
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "dailyGoal": 15
}
```

### 📖 Vocabulary Management (`/api/vocabulary`)

> **📌 للدليل الكامل:** راجع ملف `VOCABULARY_MANAGEMENT.md` للتفاصيل الشاملة

#### إضافة كلمات من ملف JSON (الطريقة الموصى بها)

**استخدام السكريبت:**
```bash
# إضافة 1500 كلمة من ملف JSON
node importWords.js ./data/my-words.json

# حذف الكلمات القديمة وإضافة جديدة
node importWords.js ./data/my-words.json --clear

# تحديث الكلمات الموجودة وإضافة جديدة
node importWords.js ./data/my-words.json --update
```

**هيكل ملف JSON:**
```json
[
  {
    "wordId": "word_001",
    "word": "Hello",
    "translation": "مرحبا",
    "pronunciation": "həˈloʊ",
    "category": "basic",
    "difficulty": 1,
    "groupNumber": 1,
    "examples": [
      {"english": "Hello, how are you?", "arabic": "مرحبا، كيف حالك؟"}
    ],
    "synonyms": ["Hi", "Hey"],
    "antonyms": ["Goodbye"]
  }
]
```

#### استيراد عبر API
```http
POST /api//import-from-json
Content-Type: application/json

{
  "words": [...],
  "options": {
    "clearExisting": false,
    "skipDuplicates": true,
    "updateExisting": false
  }
}
```

#### إدارة الكلمات

**إضافة كلمة واحدة:**
```http
POST /api/vocabulary/add-word
Content-Type: application/json

{
  "wordId": "word_new",
  "word": "Beautiful",
  "translation": "جميل",
  "groupNumber": 5
}
```

**تحديث كلمة:**
```http
PUT /api/vocabulary/update-word/:wordId
Content-Type: application/json

{
  "translation": "ترجمة محدثة",
  "difficulty": 3
}
```

**حذف كلمة:**
```http
DELETE /api/vocabulary/delete-word/:wordId
```

**الحصول على الكلمات:**
```http
GET /api//all-words?page=1&limit=50
GET /api/vocabulary/all-words?groupNumber=5
GET /api/vocabulary/all-words?category=basic
```

**الإحصائيات:**
```http
GET /api/vocabulary/stats
GET /api/vocabulary/groups
```

## ⏰ المهام المجدولة (Cron Jobs)

### 1. حذف الحسابات غير النشطة
- **التوقيت:** كل يوم الساعة 3 صباحاً
- **الوظيفة:** حذف الحسابات التي لم يتم تسجيل الدخول إليها لمدة 45 يوم

### 2. تحديث حالة العادات
- **التوقيت:** كل ساعة
- **الوظيفة:** تحديث حالة العادات المنتهية (مكتملة أو فاشلة)

### 3. إعادة تعيين الإحصائيات اليومية
- **التوقيت:** كل يوم منتصف الليل
- **الوظيفة:** إعادة تعيين إحصائيات التعلم اليومية

## 📧 إعداد البريد الإلكتروني

### استخدام Gmail

1. تفعيل المصادقة الثنائية في حساب Gmail
2. إنشاء كلمة سر خاصة بالتطبيق:
   - انتقل إلى: https://myaccount.google.com/security
   - اختر "App passwords"
   - أنشئ كلمة سر جديدة
3. استخدم البريد الإلكتروني وكلمة السر الخاصة في ملف `.env`

## 🔒 الأمان

- كلمات السر محمية ببروتوكول bcrypt
- JWT tokens للمصادقة
- Middleware للتحقق من الصلاحيات
- التحقق من صحة البيانات باستخدام express-validator

## 🌐 الربط مع React Native

مثال على استدعاء API من React Native:

```javascript
import axios from 'axios';

const API_URL = 'http://YOUR_SERVER_IP:5000/api';

// تسجيل الدخول
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    // حفظ التوكن
    const token = response.data.token;
    await AsyncStorage.setItem('token', token);
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response.data);
    throw error;
  }
};

// استدعاء API محمي
const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response.data);
    throw error;
  }
};
```

## 🐛 حل المشاكل

### خطأ الاتصال بقاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
sudo systemctl start mongod

# أو إذا كنت تستخدم Docker
docker start mongodb
```

### خطأ إرسال البريد الإلكتروني
- تأكد من صحة بيانات البريد الإلكتروني في `.env`
- تحقق من تفعيل "Less secure app access" أو استخدام App Password

### Port already in use
```bash
# إيجاد العملية التي تستخدم المنفذ
lsof -i :5000

# إيقاف العملية
kill -9 PID
```

## 📝 ملاحظات مهمة

1. **حماية ملف .env:** لا تشارك ملف `.env` أو تضيفه إلى Git
2. **تغيير JWT_SECRET:** استخدم مفتاح سري قوي في الإنتاج
3. **MongoDB Atlas:** للإنتاج، يُنصح باستخدام MongoDB Atlas
4. **HTTPS:** في الإنتاج، استخدم HTTPS بدلاً من HTTP

## 📄 الترخيص

هذا المشروع مملوك لـ c12

## 👨‍💻 المطور

تم التطوير بواسطة c12

---

**للدعم والاستفسارات:** يرجى فتح issue في المشروع
