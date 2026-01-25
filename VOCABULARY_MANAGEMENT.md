# إدارة الكلمات - Vocabulary Management

## 📚 نظرة عامة

يوفر النظام طريقتين لإدارة الكلمات:
1. **من خلال ملفات JSON** - الطريقة الموصى بها للإضافة الجماعية
2. **من خلال API** - للإدارة اليومية والتعديلات

---

## 📁 الطريقة 1: استيراد من ملف JSON

### هيكل ملف JSON

يجب أن يكون ملف JSON مصفوفة من الكلمات بالشكل التالي:

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
      {
        "english": "Hello, how are you?",
        "arabic": "مرحبا، كيف حالك؟"
      }
    ],
    "synonyms": ["Hi", "Hey"],
    "antonyms": ["Goodbye"],
    "isActive": true
  }
]
```

### الحقول المطلوبة والاختيارية

#### مطلوبة ⭐
- `wordId` (string) - معرف فريد للكلمة
- `word` (string) - الكلمة بالإنجليزية
- `translation` (string) - الترجمة بالعربية
- `groupNumber` (number) - رقم المجموعة

#### اختيارية
- `pronunciation` (string) - النطق الصوتي
- `category` (string) - التصنيف: `basic`, `intermediate`, `advanced`, `common`, `business`, `travel`, `academic`
- `difficulty` (number) - مستوى الصعوبة: 1-5
- `examples` (array) - أمثلة على الكلمة
- `synonyms` (array) - المرادفات
- `antonyms` (array) - الأضداد
- `isActive` (boolean) - فعالة أم لا (افتراضي: true)

---

## 🚀 طرق الاستيراد

### الطريقة 1: استخدام السكريبت (الأسرع)

```bash
# استيراد كلمات جديدة (تجاهل المكررة)
node importWords.js ./data/my-words.json

# حذف كل الكلمات الموجودة ثم استيراد جديدة
node importWords.js ./data/my-words.json --clear

# تحديث الكلمات الموجودة + إضافة الجديدة
node importWords.js ./data/my-words.json --update
```

### الطريقة 2: استخدام API

```bash
curl -X POST http://localhost:5000/api/vocabulary/import-from-json \
  -H "Content-Type: application/json" \
  -d '{
    "words": [
      {
        "wordId": "word_001",
        "word": "Hello",
        "translation": "مرحبا",
        "groupNumber": 1
      }
    ],
    "options": {
      "clearExisting": false,
      "skipDuplicates": true,
      "updateExisting": false
    }
  }'
```

---

## 🔌 API Endpoints للإدارة اليومية

### إضافة كلمة واحدة

```http
POST /api/vocabulary/add-word
Content-Type: application/json

{
  "wordId": "word_new",
  "word": "Beautiful",
  "translation": "جميل",
  "groupNumber": 5,
  "category": "basic",
  "difficulty": 2
}
```

### تحديث كلمة

```http
PUT /api/vocabulary/update-word/word_001
Content-Type: application/json

{
  "translation": "مرحباً (محدّث)",
  "difficulty": 2
}
```

### حذف كلمة

```http
DELETE /api/vocabulary/delete-word/word_001
```

### الحصول على جميع الكلمات (مع pagination)

```http
GET /api/vocabulary/all-words?page=1&limit=50
GET /api/vocabulary/all-words?groupNumber=5
GET /api/vocabulary/all-words?category=basic
GET /api/vocabulary/all-words?search=hello
```

### إحصائيات المجموعات

```http
GET /api/vocabulary/groups
```

**Response:**
```json
{
  "success": true,
  "totalWords": 1500,
  "totalGroups": 150,
  "groups": [
    {
      "groupNumber": 1,
      "wordsCount": 10,
      "categories": ["basic"]
    }
  ]
}
```

### إحصائيات شاملة

```http
GET /api/vocabulary/stats
```

---

## 📝 أمثلة عملية

### مثال 1: إضافة 1500 كلمة من ملف

1. ضع ملف JSON في مجلد `data/`:
```bash
data/my-1500-words.json
```

2. نفذ السكريبت:
```bash
node importWords.js ./data/my-1500-words.json
```

### مثال 2: تحديث كلمات موجودة

```bash
node importWords.js ./data/updated-words.json --update
```

### مثال 3: استبدال كل الكلمات بملف جديد

```bash
node importWords.js ./data/new-words.json --clear
```

### مثال 4: إضافة كلمات تدريجياً عبر API

استخدم Postman أو أي أداة API لإرسال الكلمات واحدة تلو الأخرى.

---

## ✅ نصائح مهمة

### 1. تنظيم المجموعات
- كل مجموعة يجب أن تحتوي على 10 كلمات
- رقم المجموعات يبدأ من 1
- يمكنك تخطي مجموعات (مثلاً: 1, 2, 5, 10)

### 2. معرفات الكلمات (wordId)
- يجب أن تكون فريدة
- يُفضل استخدام نمط: `word_001`, `word_002`, إلخ
- أو حسب المجموعة: `g1_word_001`, `g2_word_001`

### 3. التصنيفات المتاحة
- `basic` - كلمات أساسية
- `intermediate` - متوسطة
- `advanced` - متقدمة
- `common` - شائعة
- `business` - أعمال
- `travel` - سفر
- `academic` - أكاديمية

### 4. مستويات الصعوبة
- `1` - سهل جداً
- `2` - سهل
- `3` - متوسط
- `4` - صعب
- `5` - صعب جداً

---

## 🔧 استكشاف الأخطاء

### خطأ: "بعض الكلمات موجودة مسبقاً"
**الحل:** استخدم `--update` لتحديث الكلمات الموجودة

### خطأ: "بيانات ناقصة"
**الحل:** تأكد من وجود `wordId`, `word`, `translation`, `groupNumber` لكل كلمة

### خطأ: "الملف غير موجود"
**الحل:** تأكد من المسار الصحيح للملف

---

## 📊 مثال كامل لملف 1500 كلمة

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
      {"english": "Hello!", "arabic": "مرحبا!"}
    ],
    "synonyms": ["Hi"],
    "antonyms": ["Goodbye"]
  },
  {
    "wordId": "word_002",
    "word": "Thank you",
    "translation": "شكراً",
    "category": "basic",
    "difficulty": 1,
    "groupNumber": 1
  }
  // ... 1498 كلمة أخرى
]
```

---

## 🎯 سير العمل الموصى به

### للإضافة الأولى (1500 كلمة):
1. أنشئ ملف JSON بجميع كلماتك
2. تأكد من صحة البيانات
3. نفذ: `node importWords.js ./data/words.json --clear`

### للإضافة اللاحقة:
1. أضف كلمات جديدة في ملف JSON
2. نفذ: `node importWords.js ./data/new-words.json`

### للتعديلات اليومية:
استخدم API endpoints لإضافة/تحديث/حذف كلمات فردية

---

## 📞 الدعم

للمزيد من المساعدة، راجع الملفات:
- `README.md` - الدليل الشامل
- `QUICK_START_AR.md` - دليل البدء السريع
- `data/words-example.json` - مثال لهيكل الملف
