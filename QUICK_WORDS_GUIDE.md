# دليل سريع: إضافة 1500 كلمة 🚀

## الطريقة الأسهل والأسرع

### الخطوة 1: تحضير ملف JSON

احفظ كلماتك الـ 1500 في ملف JSON بهذا الشكل:

```json
[
  {
    "wordId": "word_001",
    "word": "Hello",
    "translation": "مرحبا",
    "groupNumber": 1
  },
  {
    "wordId": "word_002",
    "word": "World",
    "translation": "عالم",
    "groupNumber": 1
  }
  ... 1498 كلمة أخرى
]
```

**الحقول المطلوبة فقط:**
- `wordId` - معرف فريد (مثل: word_001, word_002)
- `word` - الكلمة بالإنجليزية
- `translation` - الترجمة بالعربية
- `groupNumber` - رقم المجموعة (كل 10 كلمات = مجموعة واحدة)

**حقول اختيارية (يمكن إضافتها لاحقاً):**
- `pronunciation` - النطق
- `category` - التصنيف (basic, intermediate, advanced)
- `difficulty` - الصعوبة (1-5)
- `examples` - أمثلة
- `synonyms` - مرادفات
- `antonyms` - أضداد

### الخطوة 2: حفظ الملف

احفظ الملف في مجلد `data`:
```
defy-self-backend/data/my-words.json
```

### الخطوة 3: تنفيذ الاستيراد

```bash
node importWords.js ./data/my-words.json
```

**هذا كل شيء!** 🎉

---

## أوامر مفيدة

### إضافة كلمات جديدة (الأولى)
```bash
node importWords.js ./data/my-words.json
```

### استبدال كل الكلمات
```bash
node importWords.js ./data/new-words.json --clear
```

### إضافة + تحديث
```bash
node importWords.js ./data/updated-words.json --update
```

---

## مثال عملي كامل

### 1. أنشئ ملف `data/words.json`:

```json
[
  {"wordId": "w1", "word": "Hello", "translation": "مرحبا", "groupNumber": 1},
  {"wordId": "w2", "word": "World", "translation": "عالم", "groupNumber": 1},
  {"wordId": "w3", "word": "Good", "translation": "جيد", "groupNumber": 1},
  {"wordId": "w4", "word": "Bad", "translation": "سيء", "groupNumber": 1},
  {"wordId": "w5", "word": "Yes", "translation": "نعم", "groupNumber": 1},
  {"wordId": "w6", "word": "No", "translation": "لا", "groupNumber": 1},
  {"wordId": "w7", "word": "Please", "translation": "من فضلك", "groupNumber": 1},
  {"wordId": "w8", "word": "Thanks", "translation": "شكراً", "groupNumber": 1},
  {"wordId": "w9", "word": "Water", "translation": "ماء", "groupNumber": 1},
  {"wordId": "w10", "word": "Food", "translation": "طعام", "groupNumber": 1}
]
```

### 2. نفذ الأمر:

```bash
node importWords.js ./data/words.json
```

### 3. النتيجة:

```
✅ تم استيراد: 10 كلمة
📊 إجمالي الكلمات النشطة: 10
   توزيع المجموعات:
   المجموعة 1: 10 كلمة
```

---

## نصائح للـ 1500 كلمة

### تنظيم المجموعات:
- 1500 كلمة = 150 مجموعة (كل مجموعة 10 كلمات)
- مثال:
  - المجموعة 1: كلمات 1-10
  - المجموعة 2: كلمات 11-20
  - وهكذا...

### معرفات الكلمات:
يمكنك استخدام أي نمط، مثل:
- `word_001` إلى `word_1500`
- أو `w1` إلى `w1500`
- أو `eng_001` إلى `eng_1500`

### التحقق من النجاح:
بعد الاستيراد، استخدم:
```bash
curl http://localhost:5000/api/vocabulary/stats
```

سيعرض:
```json
{
  "success": true,
  "totalWords": 1500,
  "statistics": {...}
}
```

---

## استكشاف الأخطاء

### خطأ: "الملف غير موجود"
✅ تأكد من المسار: `./data/my-words.json`

### خطأ: "بيانات ناقصة"
✅ تأكد من وجود wordId, word, translation, groupNumber لكل كلمة

### خطأ: "بعض الكلمات موجودة مسبقاً"
✅ استخدم `--update` أو `--clear`

---

## إضافة كلمات لاحقاً

عندما تريد إضافة المزيد من الكلمات:

1. أنشئ ملف جديد: `data/new-words.json`
2. نفذ: `node importWords.js ./data/new-words.json`

الكلمات الجديدة ستُضاف دون حذف القديمة!

---

## للمزيد من التفاصيل

راجع ملف: **VOCABULARY_MANAGEMENT.md**

---

**ملاحظة:** ملف `seedVocabulary.js` يضيف فقط 50 كلمة للتجربة.
للاستخدام الفعلي، استخدم `importWords.js` كما هو موضح أعلاه.
