const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';

// بيانات اختبار تحديث الإعدادات
const testSettingsUpdate = {
  system_name: 'نظام إدارة المهام المحدث',
  system_description: '// في routes/settings.js - السطر 24
*           example: 'تنجيز - نظام متكامل لإدارة المهام والعمليات',
  system_primary_color: '#FF5722',
  system_secondary_color: '#4CAF50',
  system_language: 'ar',
  system_timezone: 'Asia/Riyadh',
  security_login_attempts_limit: 7,
  security_lockout_duration: 45,
  security_session_timeout: 600,
  security_password_min_length: 10,
  integrations_email_smtp_host: 'smtp.outlook.com',
  integrations_email_smtp_port: 587,
  integrations_email_smtp_username: 'noreply@company.com',
  integrations_email_smtp_password: 'newpassword123',
  integrations_email_from_address: 'system@company.com',
  integrations_email_from_name: 'نظام إدارة المهام',
  notifications_enabled: true,
  notifications_email_enabled: true,
  maintenance_mode: false,
  default_ticket_priority: 'high',
  auto_assign_tickets: true
};

async function testUpdateSettings() {
  console.log('🔄 اختبار تحديث إعدادات النظام...\n');

  try {
    // 1. جلب الإعدادات الحالية أولاً
    console.log('1️⃣ جلب الإعدادات الحالية...');
    const getCurrentResponse = await axios.get(`${BASE_URL}/settings`);
    
    if (getCurrentResponse.data.success) {
      console.log('✅ تم جلب الإعدادات الحالية بنجاح');
      console.log('📋 الإعدادات الحالية:', JSON.stringify(getCurrentResponse.data.data, null, 2));
    } else {
      console.log('❌ فشل في جلب الإعدادات الحالية');
      return;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. تحديث الإعدادات
    console.log('2️⃣ تحديث الإعدادات...');
    console.log('📤 البيانات المُرسلة:', JSON.stringify(testSettingsUpdate, null, 2));
    
    const updateResponse = await axios.put(`${BASE_URL}/settings`, testSettingsUpdate, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (updateResponse.data.success) {
      console.log('✅ تم تحديث الإعدادات بنجاح');
      console.log('📋 الإعدادات المحدثة:', JSON.stringify(updateResponse.data.data, null, 2));
      console.log('💬 رسالة النجاح:', updateResponse.data.message);
    } else {
      console.log('❌ فشل في تحديث الإعدادات');
      console.log('❌ الخطأ:', updateResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. التحقق من التحديث بجلب الإعدادات مرة أخرى
    console.log('3️⃣ التحقق من التحديث...');
    const verifyResponse = await axios.get(`${BASE_URL}/settings`);
    
    if (verifyResponse.data.success) {
      console.log('✅ تم التحقق من التحديث بنجاح');
      const updatedSettings = verifyResponse.data.data;
      
      // مقارنة القيم المحدثة
      console.log('\n📊 مقارنة التحديثات:');
      console.log(`🏢 اسم النظام: ${updatedSettings.system_name}`);
      console.log(`📝 وصف النظام: ${updatedSettings.system_description}`);
      console.log(`🎨 اللون الأساسي: ${updatedSettings.system_primary_color}`);
      console.log(`🎨 اللون الثانوي: ${updatedSettings.system_secondary_color}`);
      console.log(`🌐 اللغة: ${updatedSettings.system_language}`);
      console.log(`🔐 محاولات تسجيل الدخول: ${updatedSettings.security_login_attempts_limit}`);
      console.log(`⏰ مدة الحظر: ${updatedSettings.security_lockout_duration} دقيقة`);
      console.log(`📧 خادم SMTP: ${updatedSettings.integrations_email_smtp_host}`);
      console.log(`🔌 منفذ SMTP: ${updatedSettings.integrations_email_smtp_port}`);
      console.log(`👤 مستخدم SMTP: ${updatedSettings.integrations_email_smtp_username}`);
      console.log(`🔑 كلمة مرور SMTP: ${updatedSettings.integrations_email_smtp_password}`);
      console.log(`📬 عنوان المرسل: ${updatedSettings.integrations_email_from_address}`);
      console.log(`📋 أولوية التذكرة الافتراضية: ${updatedSettings.default_ticket_priority}`);
      console.log(`🔔 الإشعارات مفعلة: ${updatedSettings.notifications_enabled}`);
      console.log(`🎫 تعيين تلقائي للتذاكر: ${updatedSettings.auto_assign_tickets}`);
      
      // التحقق من صحة التحديثات
      let allUpdatesCorrect = true;
      
      if (updatedSettings.system_name !== testSettingsUpdate.system_name) {
        console.log('❌ اسم النظام لم يتم تحديثه بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.system_description !== testSettingsUpdate.system_description) {
        console.log('❌ وصف النظام لم يتم تحديثه بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.system_primary_color !== testSettingsUpdate.system_primary_color) {
        console.log('❌ اللون الأساسي لم يتم تحديثه بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.security_login_attempts_limit !== testSettingsUpdate.security_login_attempts_limit) {
        console.log('❌ محاولات تسجيل الدخول لم يتم تحديثها بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.security_lockout_duration !== testSettingsUpdate.security_lockout_duration) {
        console.log('❌ مدة الحظر لم يتم تحديثها بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.integrations_email_smtp_host !== testSettingsUpdate.integrations_email_smtp_host) {
        console.log('❌ خادم SMTP لم يتم تحديثه بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.integrations_email_smtp_port !== testSettingsUpdate.integrations_email_smtp_port) {
        console.log('❌ منفذ SMTP لم يتم تحديثه بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      if (updatedSettings.default_ticket_priority !== testSettingsUpdate.default_ticket_priority) {
        console.log('❌ أولوية التذكرة الافتراضية لم يتم تحديثها بشكل صحيح');
        allUpdatesCorrect = false;
      }
      
      // ملاحظة: كلمة مرور SMTP مخفية في الاستجابة
      if (updatedSettings.integrations_email_smtp_password !== '***') {
        console.log('❌ كلمة مرور SMTP يجب أن تكون مخفية في الاستجابة');
        allUpdatesCorrect = false;
      }
      
      if (allUpdatesCorrect) {
        console.log('\n🎉 جميع التحديثات تمت بنجاح!');
      } else {
        console.log('\n⚠️ بعض التحديثات لم تتم بشكل صحيح');
      }
      
    } else {
      console.log('❌ فشل في التحقق من التحديث');
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', error.response.data);
      console.error('🔢 كود الحالة:', error.response.status);
    }
  }
}

// اختبار تحديث جزئي للإعدادات
async function testPartialUpdate() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 اختبار التحديث الجزئي للإعدادات...\n');

  try {
    // تحديث اسم النظام فقط
    const partialUpdate = {
      system_name: 'اسم النظام الجديد فقط'
    };

    console.log('📤 تحديث جزئي - اسم النظام فقط:', partialUpdate.system_name);
    
    const response = await axios.put(`${BASE_URL}/settings`, partialUpdate, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ تم التحديث الجزئي بنجاح');
      console.log('🏢 اسم النظام الجديد:', response.data.data.system_name);
      
      // التحقق من أن الحقول الأخرى لم تتغير
      console.log('🔍 التحقق من الحقول الأخرى...');
      console.log('📧 خادم SMTP (يجب أن يبقى كما هو):', response.data.data.integrations_email_smtp_host);
      console.log('🔌 منفذ SMTP (يجب أن يبقى كما هو):', response.data.data.integrations_email_smtp_port);
      
    } else {
      console.log('❌ فشل في التحديث الجزئي');
      console.log('❌ الخطأ:', response.data.error);
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار التحديث الجزئي:', error.message);
    
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', error.response.data);
    }
  }
}

// اختبار بيانات غير صحيحة
async function testInvalidData() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 اختبار البيانات غير الصحيحة...\n');

  try {
    // بيانات غير صحيحة
    const invalidData = {
      security_login_attempts_limit: -1, // قيمة سالبة
      security_lockout_duration: 0, // قيمة صفر
      integrations_email_smtp_port: 70000, // منفذ غير صحيح
      system_primary_color: 'invalid-color', // لون غير صحيح
      system_language: 'invalid-lang', // لغة غير صحيحة
      default_ticket_priority: 'invalid-priority', // أولوية غير صحيحة
      notifications_enabled: 'not-boolean' // قيمة غير منطقية
    };

    console.log('📤 إرسال بيانات غير صحيحة:', JSON.stringify(invalidData, null, 2));
    
    const response = await axios.put(`${BASE_URL}/settings`, invalidData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // إذا نجح الطلب، فهناك مشكلة في التحقق من صحة البيانات
    console.log('⚠️ تحذير: تم قبول البيانات غير الصحيحة!');
    console.log('📋 الاستجابة:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ تم رفض البيانات غير الصحيحة بشكل صحيح');
      console.log('📄 رسالة الخطأ:', error.response.data.message);
    } else {
      console.error('❌ خطأ غير متوقع:', error.message);
    }
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبارات endpoint PUT /api/settings\n');
  
  await testUpdateSettings();
  await testPartialUpdate();
  await testInvalidData();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ انتهت جميع الاختبارات');
}

// تشغيل الاختبارات
runAllTests().catch(console.error);
