const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

class EmailService {
  /**
   * إنشاء transporter من إعدادات النظام
   */
  static async createTransporter() {
    try {
      const settings = await Settings.getSettings();
      
      // التحقق من تفعيل البريد الإلكتروني
      if (!settings.integrations_email_enabled) {
        throw new Error('البريد الإلكتروني غير مفعل في إعدادات النظام');
      }
      
      // التحقق من وجود بيانات SMTP
      if (!settings.integrations_email_smtp_host || !settings.integrations_email_smtp_port) {
        throw new Error('إعدادات SMTP غير مكتملة في إعدادات النظام');
      }
      
      // إنشاء transporter
      const transporter = nodemailer.createTransport({
        host: settings.integrations_email_smtp_host,
        port: settings.integrations_email_smtp_port,
        secure: settings.integrations_email_smtp_port === 465, // true for 465, false for other ports
        auth: {
          user: settings.integrations_email_smtp_username,
          pass: settings.integrations_email_smtp_password
        },
        tls: {
          rejectUnauthorized: false // للسماح بشهادات SSL غير الموثوقة (في البيئة التطويرية)
        }
      });
      
      // التحقق من الاتصال
      await transporter.verify();
      
      return {
        transporter,
        fromAddress: settings.integrations_email_from_address || settings.integrations_email_smtp_username,
        fromName: settings.integrations_email_from_name || settings.system_name || 'نظام إدارة المهام'
      };
    } catch (error) {
      console.error('خطأ في إنشاء email transporter:', error);
      throw new Error(`فشل في إعداد البريد الإلكتروني: ${error.message}`);
    }
  }

  /**
   * إنشاء تمبلت HTML للرسائل مع هوية الشركة
   * @param {Object} data - البيانات الديناميكية للرسالة
   * @param {string} data.title - عنوان الرسالة
   * @param {string} data.content - محتوى الرسالة (HTML)
   * @param {string} data.footer - نص التذييل (اختياري)
   * @param {Object} settings - إعدادات النظام (مطلوب)
   */
  static createEmailTemplate(data, settings) {
    // الألوان الافتراضية
    const primaryColor = settings?.system_primary_color || '#FF5722';
    const secondaryColor = settings?.system_secondary_color || '#4CAF50';
    const systemName = settings?.system_name || 'نظام إدارة المهام';
    const systemDescription = settings?.system_description || '';
    
    // بناء رابط الشعار الكامل للإيميل
    // إذا كان system_logo_url مسار نسبي، نضيف api_base_url (للصور والملفات الثابتة)
    let systemLogo = settings?.system_logo_url || '';
    if (systemLogo) {
      // استخدام api_base_url للصور والملفات الثابتة (وليس frontend_url)
      const apiBaseUrl = settings?.api_base_url || 'http://localhost:3003';
      const baseUrl = apiBaseUrl.replace(/\/$/, '');
      
      // إذا كان الرابط يبدأ بـ / أو uploads، فهو مسار نسبي
      if (systemLogo.startsWith('/') || systemLogo.startsWith('uploads/')) {
        // إزالة الشرطة المائلة الأولى إذا كانت موجودة
        const logoPath = systemLogo.startsWith('/') ? systemLogo : '/' + systemLogo;
        systemLogo = `${baseUrl}${logoPath}`;
      } else if (!systemLogo.startsWith('http://') && !systemLogo.startsWith('https://')) {
        // إذا لم يكن رابط كامل ولا مسار نسبي، نضيف api_base_url
        systemLogo = `${baseUrl}/${systemLogo}`;
      }
      // إذا كان رابط كامل (http:// أو https://)، نستخدمه كما هو
    }

    // بناء التمبلت
    const template = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title || 'رسالة من النظام'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            direction: rtl;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }
        .email-logo {
            max-width: 150px;
            max-height: 80px;
            margin-bottom: 15px;
            border-radius: 4px;
            display: block;
            margin-left: auto;
            margin-right: auto;
            object-fit: contain;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 5px;
        }
        .email-header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            font-weight: 600;
        }
        .email-header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .email-body {
            padding: 30px 20px;
            color: #333333;
            line-height: 1.6;
        }
        .email-title {
            font-size: 20px;
            color: ${primaryColor};
            margin-bottom: 20px;
            font-weight: 600;
        }
        .email-content {
            font-size: 16px;
            color: #555555;
            margin-bottom: 20px;
        }
        .email-content p {
            margin-bottom: 15px;
        }
        .email-content ul, .email-content ol {
            margin: 15px 0;
            padding-right: 25px;
        }
        .email-content li {
            margin-bottom: 8px;
        }
        .email-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: ${primaryColor};
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
        }
        .email-button:hover {
            background-color: ${secondaryColor};
        }
        .email-footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eeeeee;
            color: #888888;
            font-size: 12px;
        }
        .email-footer p {
            margin-bottom: 5px;
        }
        .email-divider {
            height: 1px;
            background-color: #eeeeee;
            margin: 20px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .email-body {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${systemLogo ? `<img src="${systemLogo}" alt="${systemName}" class="email-logo" />` : ''}
            <h1>${systemName}</h1>
            ${systemDescription ? `<p>${systemDescription}</p>` : ''}
        </div>
        
        <div class="email-body">
            ${data.title ? `<h2 class="email-title">${data.title}</h2>` : ''}
            
            <div class="email-content">
                ${data.content || ''}
            </div>
            
            ${data.buttonText && data.buttonUrl ? `
                <div style="text-align: center;">
                    <a href="${data.buttonUrl}" class="email-button">${data.buttonText}</a>
                </div>
            ` : ''}
            
            ${data.footer ? `
                <div class="email-divider"></div>
                <p style="color: #888888; font-size: 14px;">${data.footer}</p>
            ` : ''}
        </div>
        
        <div class="email-footer">
            <p><strong>${systemName}</strong></p>
            <p>هذه رسالة تلقائية من النظام، يرجى عدم الرد عليها</p>
            <p style="margin-top: 10px; font-size: 11px; color: #aaaaaa;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة
            </p>
        </div>
    </div>
</body>
</html>
    `;

    return template.trim();
  }

  /**
   * إرسال رسالة بريد إلكتروني
   * @param {Object} options - خيارات الرسالة
   * @param {string|string[]} options.to - عنوان البريد الإلكتروني للمستلم (أو مصفوفة)
   * @param {string} options.subject - موضوع الرسالة
   * @param {string} options.html - محتوى HTML للرسالة
   * @param {string} options.text - محتوى نصي للرسالة (اختياري)
   * @param {string|string[]} options.cc - نسخة (اختياري)
   * @param {string|string[]} options.bcc - نسخة مخفية (اختياري)
   * @param {Object[]} options.attachments - مرفقات (اختياري)
   * @param {Object} options.templateData - بيانات التمبلت (اختياري)
   */
  static async sendEmail(options) {
    try {
      const { transporter, fromAddress, fromName } = await this.createTransporter();
      
      // إذا تم تمرير templateData، استخدم التمبلت
      let htmlContent = options.html;
      if (options.templateData) {
        const settings = await Settings.getSettings();
        htmlContent = this.createEmailTemplate(options.templateData, settings);
      }
      
      // إعداد خيارات الرسالة
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: htmlContent,
        text: options.text || this.stripHTML(htmlContent),
        ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc }),
        ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc }),
        ...(options.attachments && { attachments: options.attachments })
      };
      
      // إرسال الرسالة
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ تم إرسال البريد الإلكتروني بنجاح:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
      throw error;
    }
  }

  /**
   * تحويل HTML إلى نص عادي
   */
  static stripHTML(html) {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * إرسال رسالة باستخدام التمبلت الجاهز
   * @param {Object} params - معاملات الرسالة
   * @param {string|string[]} params.to - عنوان البريد الإلكتروني للمستلم
   * @param {string} params.subject - موضوع الرسالة
   * @param {string} params.title - عنوان الرسالة في التمبلت
   * @param {string} params.content - محتوى الرسالة (HTML)
   * @param {string} params.buttonText - نص الزر (اختياري)
   * @param {string} params.buttonUrl - رابط الزر (اختياري)
   * @param {string} params.footer - نص التذييل (اختياري)
   * @param {string|string[]} params.cc - نسخة (اختياري)
   * @param {string|string[]} params.bcc - نسخة مخفية (اختياري)
   * @param {Object[]} params.attachments - مرفقات (اختياري)
   */
  static async sendTemplatedEmail(params) {
    const templateData = {
      title: params.title,
      content: params.content,
      buttonText: params.buttonText,
      buttonUrl: params.buttonUrl,
      footer: params.footer
    };

    return await this.sendEmail({
      to: params.to,
      subject: params.subject,
      templateData: templateData,
      cc: params.cc,
      bcc: params.bcc,
      attachments: params.attachments
    });
  }
}

module.exports = EmailService;

