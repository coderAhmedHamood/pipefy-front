const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
require('dotenv').config();

async function runExtendedMigration() {
  try {
    console.log('🔄 بدء تشغيل migration النظام المتكامل...');
    
    // قراءة ملف الـ migration
    const migrationPath = path.join(__dirname, '..', 'migrations', '003_create_extended_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // تشغيل الـ migration
    await pool.query(migrationSQL);
    
    console.log('✅ تم تشغيل migration النظام المتكامل بنجاح!');
    
    // إضافة بيانات تجريبية للجداول الجديدة
    console.log('🔄 إضافة بيانات تجريبية للجداول الجديدة...');
    
    // الحصول على معرف المستخدم الإداري
    const adminUser = await pool.query(`
      SELECT id FROM users WHERE email = 'admin@pipefy.com' LIMIT 1
    `);
    
    if (adminUser.rows.length === 0) {
      throw new Error('لم يتم العثور على المستخدم الإداري');
    }
    
    const adminUserId = adminUser.rows[0].id;
    
    // إضافة تكاملات تجريبية
    await pool.query(`
      INSERT INTO integrations (name, description, integration_type, endpoint, trigger_events, created_by)
      VALUES 
      ('Slack Notifications', 'إرسال إشعارات إلى Slack', 'webhook', 'https://hooks.slack.com/services/example', 
       ARRAY['ticket_created', 'stage_changed'], $1),
      ('Email Notifications', 'إرسال إشعارات بالبريد الإلكتروني', 'email', 'smtp://mail.example.com', 
       ARRAY['ticket_assigned', 'ticket_completed'], $1),
      ('Teams Integration', 'تكامل مع Microsoft Teams', 'webhook', 'https://outlook.office.com/webhook/example', 
       ARRAY['ticket_overdue', 'comment_added'], $1)
    `, [adminUserId]);
    
    // إضافة إشعارات تجريبية
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, notification_type, data)
      VALUES 
      ($1, 'مرحباً بك في النظام', 'تم إنشاء حسابك بنجاح في نظام إدارة العمليات', 'welcome', 
       '{"icon": "welcome", "color": "green"}'),
      ($1, 'تذكرة جديدة', 'تم إنشاء تذكرة جديدة وتحتاج إلى مراجعة', 'ticket_created', 
       '{"ticket_id": "example", "priority": "high"}'),
      ($1, 'تحديث النظام', 'تم تحديث النظام بميزات جديدة', 'system_update', 
       '{"version": "2.0", "features": ["automation", "integrations"]}')
    `, [adminUserId]);
    
    // إضافة إحصائيات يومية تجريبية
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // الحصول على معرف عملية تجريبية
    const process = await pool.query(`
      SELECT id FROM processes LIMIT 1
    `);
    
    if (process.rows.length > 0) {
      const processId = process.rows[0].id;
      
      await pool.query(`
        INSERT INTO daily_statistics (date, process_id, tickets_created, tickets_completed, tickets_moved, active_users, api_calls)
        VALUES 
        ($1, $2, 15, 8, 12, 5, 245),
        ($3, $2, 12, 10, 8, 4, 198)
        ON CONFLICT (date, process_id) DO NOTHING
      `, [today, processId, yesterday]);
    }
    
    // إضافة سجلات أداء تجريبية
    await pool.query(`
      INSERT INTO performance_logs (endpoint, http_method, response_time_ms, status_code, user_id)
      VALUES 
      ('/api/tickets', 'GET', 150, 200, $1),
      ('/api/processes', 'GET', 89, 200, $1),
      ('/api/stages', 'POST', 245, 201, $1),
      ('/api/users', 'GET', 67, 200, $1),
      ('/api/tickets/search', 'POST', 320, 200, $1)
    `, [adminUserId]);
    
    // إضافة سجلات تدقيق تجريبية
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, success)
      VALUES 
      ($1, 'CREATE', 'ticket', gen_random_uuid(), '{"title": "تذكرة تجريبية"}', true),
      ($1, 'UPDATE', 'process', gen_random_uuid(), '{"name": "عملية محدثة"}', true),
      ($1, 'DELETE', 'stage', gen_random_uuid(), '{"name": "مرحلة محذوفة"}', true),
      ($1, 'LOGIN', 'user', $1, '{"ip": "192.168.1.1"}', true)
    `, [adminUserId]);
    
    // إضافة جلسة تجريبية
    await pool.query(`
      INSERT INTO user_sessions (user_id, token_hash, ip_address, expires_at)
      VALUES ($1, 'demo_session_hash_123', '192.168.1.1', NOW() + INTERVAL '7 days')
    `, [adminUserId]);
    
    console.log('✅ تم إضافة البيانات التجريبية للجداول الجديدة');
    
    console.log('\n🎉 تم إنجاز النظام المتكامل بنجاح!');
    console.log('\n📊 الجداول الجديدة المنشأة:');
    console.log('- integrations (التكاملات الخارجية)');
    console.log('- integration_logs (سجل التكاملات)');
    console.log('- notifications (الإشعارات)');
    console.log('- daily_statistics (الإحصائيات اليومية)');
    console.log('- performance_logs (سجل الأداء)');
    console.log('- audit_logs (سجل التدقيق)');
    console.log('- user_sessions (جلسات المستخدمين)');
    console.log('- automation_executions (سجل تنفيذ الأتمتة)');
    console.log('- recurring_rules (قواعد التكرار)');
    console.log('\n🔧 Views والدوال المنشأة:');
    console.log('- tickets_detailed (عرض التذاكر المفصل)');
    console.log('- process_statistics (إحصائيات العمليات)');
    console.log('- دوال الصيانة والتنظيف التلقائي');
    console.log('- فهارس محسنة للأداء');
    
  } catch (error) {
    console.error('❌ خطأ في تشغيل migration النظام المتكامل:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل الـ migration
if (require.main === module) {
  runExtendedMigration()
    .then(() => {
      console.log('🚀 تم الانتهاء من إعداد النظام المتكامل!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 فشل في إعداد النظام:', error.message);
      process.exit(1);
    });
}

module.exports = runExtendedMigration;
