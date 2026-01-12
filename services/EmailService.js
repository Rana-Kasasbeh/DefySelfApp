// services/EmailService.js

const BREVO_API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY || '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';
const SENDER_EMAIL = process.env.EXPO_PUBLIC_SENDER_EMAIL || 'info@alberinvestment.com';
const SENDER_NAME = process.env.EXPO_PUBLIC_SENDER_NAME || 'DefySelf Team';

/**
 * إرسال بريد إلكتروني للتحقق عبر Brevo API
 */
export const sendVerificationEmail = async (userEmail, code) => {
  if (!userEmail || !code) {
    return {
      success: false,
      error: 'البريد الإلكتروني أو الكود مفقود'
    };
  }

  const url = 'https://api.brevo.com/v3/smtp/email';
  
  const emailBody = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [{
      email: userEmail,
      name: "User"
    }],
    subject: "🔐 DefySelf - Verification Code",
    htmlContent: `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 10px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:28px">DefySelf</h1>
              <p style="color:#e0e7ff;margin:8px 0 0">Password Recovery</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 30px;text-align:center">
              <p style="color:#374151;font-size:16px;margin:0 0 30px">استخدم رمز التحقق التالي:</p>
              <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;padding:20px;display:inline-block;margin:0 0 30px">
                <span style="color:#fff;font-size:36px;font-weight:bold;letter-spacing:6px;font-family:monospace">${code}</span>
              </div>
              <div style="background:#fef3c7;border-right:4px solid #f59e0b;padding:15px;border-radius:8px;text-align:right">
                <p style="color:#92400e;margin:0;font-size:13px">⏱️ صالح لمدة دقيقتين فقط</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
              <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} DefySelf. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `DefySelf - Verification Code\n\nYour code: ${code}\n\nValid for 2 minutes.`
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = 'فشل إرسال البريد';
      
      if (response.status === 401) {
        errorMessage = 'خطأ في مفتاح API';
      } else if (response.status === 403) {
        errorMessage = 'البريد المرسل غير مفعل';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'تأكد من اتصالك بالإنترنت'
    };
  }
};