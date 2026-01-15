// services/EmailService.js
import {
  EXPO_PUBLIC_BREVO_API_KEY,
  EXPO_PUBLIC_SENDER_EMAIL,
  EXPO_PUBLIC_SENDER_NAME
} from '@env';

const BREVO_API_KEY = EXPO_PUBLIC_BREVO_API_KEY;
const SENDER_EMAIL = EXPO_PUBLIC_SENDER_EMAIL || 'noreply@defyself.app';
const SENDER_NAME = EXPO_PUBLIC_SENDER_NAME || 'DefySelf Team';

/**
 * إرسال بريد إلكتروني للتحقق عبر Brevo API
 * @param {string} userEmail - البريد الإلكتروني للمستخدم
 * @param {string} code - رمز التحقق (6 أرقام)
 * @returns {Promise<{success: boolean, error?: string, devMode?: boolean}>}
 */
export const sendVerificationEmail = async (userEmail, code) => {
  console.log('📧 EmailService: Starting verification email send...', {
    hasApiKey: !!BREVO_API_KEY,
    recipientEmail: userEmail,
    codeLength: code.length
  });

  // التحقق من المدخلات
  if (!userEmail || !code) {
    console.error('❌ Missing email or code');
    return {
      success: false,
      error: 'البريد الإلكتروني أو الكود مفقود'
    };
  }

  // التحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    console.error('❌ Invalid email format');
    return {
      success: false,
      error: 'تنسيق البريد الإلكتروني غير صحيح'
    };
  }

  // التحقق من وجود API Key
  if (!BREVO_API_KEY || BREVO_API_KEY === 'your_brevo_api_key_here' || BREVO_API_KEY.length < 20) {
    console.warn('⚠️ Development Mode: No valid Brevo API Key found');
    console.log(`📧 DEV MODE - Code for ${userEmail}: ${code}`);
    
    // محاكاة التأخير
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      devMode: true,
      message: `Development Mode: Code is ${code}`
    };
  }

  // إعداد محتوى البريد الإلكتروني
  const emailBody = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [{
      email: userEmail,
      name: "DefySelf User"
    }],
    subject: "🔐 DefySelf - رمز التحقق | Verification Code",
    htmlContent: `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DefySelf - Verification Code</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1)">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%);padding:40px 30px;text-align:center">
              <div style="background:rgba(255,255,255,0.2);width:80px;height:80px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center">
                <span style="font-size:48px">🏆</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:700;letter-spacing:-0.5px">DefySelf</h1>
              <p style="color:#e0e7ff;margin:10px 0 0;font-size:16px;font-weight:500">استعادة كلمة المرور | Password Recovery</p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding:50px 40px;text-align:center">
              <h2 style="color:#1f2937;margin:0 0 20px;font-size:24px;font-weight:700">رمز التحقق الخاص بك</h2>
              <p style="color:#6b7280;font-size:16px;margin:0 0 40px;line-height:1.6">
                استخدم الرمز التالي لإعادة تعيين كلمة المرور الخاصة بك في تطبيق DefySelf
              </p>
              
              <!-- Code Display -->
              <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:30px;margin:0 0 40px;box-shadow:0 4px 12px rgba(99,102,241,0.3)">
                <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:20px;backdrop-filter:blur(10px)">
                  <span style="color:#ffffff;font-size:48px;font-weight:900;letter-spacing:12px;font-family:'Courier New',monospace;text-shadow:0 2px 4px rgba(0,0,0,0.1)">${code}</span>
                </div>
              </div>
              
              <!-- Warning Box -->
              <div style="background:#fef3c7;border-right:4px solid #f59e0b;border-radius:10px;padding:20px;text-align:right;margin:0 0 30px">
                <div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:10px">
                  <span style="font-size:24px;margin-left:10px">⏱️</span>
                  <h3 style="color:#92400e;margin:0;font-size:16px;font-weight:700">تنبيه هام</h3>
                </div>
                <p style="color:#92400e;margin:0;font-size:14px;line-height:1.6">
                  • هذا الرمز صالح لمدة <strong>دقيقتين فقط</strong><br>
                  • لا تشارك هذا الرمز مع أي شخص<br>
                  • إذا لم تطلب هذا الرمز، تجاهل هذا البريد
                </p>
              </div>
              
              <!-- English Version -->
              <div style="border-top:2px solid #e5e7eb;padding-top:30px;text-align:left">
                <h3 style="color:#4b5563;margin:0 0 15px;font-size:18px;font-weight:600">Your Verification Code</h3>
                <p style="color:#6b7280;font-size:14px;margin:0;line-height:1.6">
                  Use this code to reset your DefySelf password. Valid for 2 minutes only.
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb">
              <p style="color:#9ca3af;font-size:14px;margin:0 0 10px;font-weight:500">تطبيق DefySelf</p>
              <p style="color:#9ca3af;font-size:12px;margin:0 0 15px">تحدى نفسك وطور عاداتك اليومية</p>
              <p style="color:#d1d5db;font-size:11px;margin:0">
                © ${new Date().getFullYear()} DefySelf. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer Note -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top:20px">
          <tr>
            <td style="text-align:center;padding:0 20px">
              <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5">
                إذا كنت تواجه مشاكل، تواصل معنا على<br>
                <a href="mailto:ranakasasbeh290@gmail.com" style="color:#6366f1;text-decoration:none;font-weight:600">ranakasasbeh290@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
DefySelf - رمز التحقق

رمز التحقق الخاص بك: ${code}

صالح لمدة دقيقتين فقط.
لا تشارك هذا الرمز مع أي شخص.

إذا لم تطلب هذا الرمز، تجاهل هذا البريد.

---

Your Verification Code: ${code}

Valid for 2 minutes only.
Do not share this code with anyone.

© ${new Date().getFullYear()} DefySelf
    `
  };

  try {
    console.log('📤 Sending email to Brevo API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    let responseData = {};
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.warn('⚠️ Could not parse response JSON');
    }
    
    console.log('📨 Brevo API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: responseData
    });

    if (response.ok) {
      console.log('✅ Email sent successfully to:', userEmail);
      return { success: true };
    } else {
      // معالجة الأخطاء المختلفة
      let errorMessage = 'فشل إرسال البريد الإلكتروني';
      
      switch (response.status) {
        case 401:
          errorMessage = 'خطأ في مفتاح API - تواصل مع المطور';
          console.error('❌ 401 Unauthorized: Invalid API Key');
          break;
        case 403:
          errorMessage = 'البريد المرسل غير مفعل في Brevo';
          console.error('❌ 403 Forbidden: Sender email not verified');
          break;
        case 400:
          errorMessage = 'بيانات البريد غير صحيحة';
          console.error('❌ 400 Bad Request:', responseData);
          break;
        case 429:
          errorMessage = 'تم تجاوز الحد اليومي - حاول غداً';
          console.error('❌ 429 Too Many Requests');
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'خطأ في خادم البريد - حاول لاحقاً';
          console.error('❌ Server Error:', response.status);
          break;
        default:
          if (responseData.message) {
            errorMessage = responseData.message;
          }
          console.error('❌ Brevo Error:', responseData);
      }
      
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('❌ Network/Fetch Error:', error);
    
    if (error.name === 'AbortError') {
      return { 
        success: false, 
        error: 'انتهت مهلة الاتصال - تحقق من الإنترنت'
      };
    }
    
    return { 
      success: false, 
      error: 'خطأ في الاتصال - تأكد من الإنترنت وحاول مرة أخرى'
    };
  }
};