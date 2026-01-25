# دليل البدء السريع - DefySelf Backend

## خطوات التشغيل السريعة

### 1️⃣ تثبيت المكتبات
```bash
npm install
```

### 2️⃣ إعداد البيئة
قم بنسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

ثم قم بتعديل الملف وإضافة بياناتك:
- رابط MongoDB
- مفتاح JWT السري
- بيانات البريد الإلكتروني

### 3️⃣ إضافة الكلمات الأولية
```bash
node seedVocabulary.js
```

### 4️⃣ تشغيل الخادم
```bash
npm start
```

## ✅ التحقق من التشغيل

افتح المتصفح وانتقل إلى:
```
http://localhost:5000
```

يجب أن ترى:
```json
{
  "success": true,
  "message": "DefySelf API Server is running",
  "version": "1.0.0"
}
```

## 📱 الربط مع التطبيق

في تطبيق React Native، استخدم:
```javascript
const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
// مثال: 'http://192.168.1.100:5000/api'
```

## 🔑 الحصول على Token

### طريقة 1: إنشاء حساب جديد
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد",
    "email": "ahmed@test.com",
    "age": 25,
    "password": "123456"
  }'
```

### طريقة 2: تسجيل الدخول
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@test.com",
    "password": "123456"
  }'
```

سيتم إرجاع Token يمكنك استخدامه في الطلبات المحمية:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

## 🧪 اختبار API

### استخدام Postman:
1. حمل Postman
2. استورد المجموعة من ملف `postman_collection.json` (إذا وُجد)
3. قم بتعيين Token في الـ Headers

### استخدام curl:
```bash
# الحصول على الملف الشخصي
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🚨 المشاكل الشائعة

### MongoDB لا يعمل
```bash
# على Ubuntu/Linux
sudo systemctl start mongod

# على macOS
brew services start mongodb-community

# على Windows
net start MongoDB
```

### المنفذ 5000 مستخدم
غيّر المنفذ في ملف `.env`:
```
PORT=3000
```

### خطأ في إرسال البريد
تأكد من:
- استخدام App Password لـ Gmail
- الإعدادات الصحيحة في `.env`
- اتصالك بالإنترنت

## 📞 المساعدة

للمزيد من المعلومات، راجع ملف `README.md` الكامل
