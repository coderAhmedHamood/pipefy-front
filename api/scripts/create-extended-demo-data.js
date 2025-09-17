const { pool } = require('../config/database');

async function createExtendedDemoData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 بدء إنشاء البيانات التجريبية الموسعة...');
    
    // 1. إضافة قواعد الأتمتة
    console.log('📋 إنشاء قواعد الأتمتة...');
    
    // جلب معرفات العمليات والمراحل الموجودة
    const processesResult = await client.query('SELECT id, name FROM processes LIMIT 3');
    const stagesResult = await client.query('SELECT id, name, process_id FROM stages LIMIT 5');
    const usersResult = await client.query('SELECT id, name FROM users WHERE is_active = true LIMIT 3');
    
    if (processesResult.rows.length > 0) {
      const automationRules = [
        {
          name: 'إشعار عند التأخير',
          description: 'إرسال إشعار تلقائي عند تأخر التذكرة عن الموعد المحدد',
          process_id: processesResult.rows[0].id,
          trigger_event: 'overdue',
          trigger_conditions: JSON.stringify([
            { field_id: 'priority', operator: 'equals', value: 'high' }
          ]),
          actions: JSON.stringify([
            {
              type: 'send_notification',
              parameters: {
                title: 'تذكرة متأخرة - أولوية عالية',
                message: 'التذكرة {{ticket_number}} متأخرة عن الموعد المحدد',
                recipients: ['assigned_user', 'manager']
              }
            }
          ]),
          is_active: true
        },
        {
          name: 'نقل تلقائي عند الموافقة',
          description: 'نقل التذكرة تلقائياً إلى المرحلة التالية عند الموافقة',
          process_id: processesResult.rows[0].id,
          trigger_event: 'field_updated',
          trigger_conditions: JSON.stringify([
            { field_id: 'approval_status', operator: 'equals', value: 'approved' }
          ]),
          actions: JSON.stringify([
            {
              type: 'move_to_stage',
              parameters: {
                stage_id: stagesResult.rows[1]?.id || null,
                comment: 'تم النقل تلقائياً بعد الموافقة'
              }
            }
          ]),
          is_active: true
        },
        {
          name: 'تعيين مستخدم حسب الأولوية',
          description: 'تعيين مستخدم متخصص للتذاكر عالية الأولوية',
          process_id: processesResult.rows[1]?.id || processesResult.rows[0].id,
          trigger_event: 'ticket_created',
          trigger_conditions: JSON.stringify([
            { field_id: 'priority', operator: 'equals', value: 'urgent' }
          ]),
          actions: JSON.stringify([
            {
              type: 'assign_user',
              parameters: {
                user_id: usersResult.rows[0]?.id || null,
                notify: true
              }
            },
            {
              type: 'send_notification',
              parameters: {
                title: 'تذكرة عاجلة جديدة',
                message: 'تم إنشاء تذكرة عاجلة وتعيينها لك',
                recipients: ['assigned_user']
              }
            }
          ]),
          is_active: true
        }
      ];
      
      for (const rule of automationRules) {
        await client.query(`
          INSERT INTO automation_rules (
            name, description, process_id, trigger_event, trigger_conditions,
            actions, is_active, execution_count, success_count, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          rule.name, rule.description, rule.process_id, rule.trigger_event,
          rule.trigger_conditions, rule.actions, rule.is_active,
          Math.floor(Math.random() * 50), Math.floor(Math.random() * 40),
          usersResult.rows[0]?.id || null
        ]);
      }
    }
    
    // 2. إضافة قواعد التكرار
    console.log('🔄 إنشاء قواعد التكرار...');
    
    if (processesResult.rows.length > 0) {
      const recurringRules = [
        {
          name: 'تقرير شهري للمبيعات',
          description: 'إنشاء تقرير شهري تلقائي للمبيعات',
          process_id: processesResult.rows[0].id,
          template_data: JSON.stringify({
            title: 'تقرير المبيعات - {{current_month}} {{current_year}}',
            description: 'تقرير شهري شامل لأداء المبيعات والإحصائيات',
            priority: 'medium',
            data: {
              report_type: 'monthly_sales',
              department: 'sales',
              auto_generated: true
            }
          }),
          schedule_type: 'monthly',
          schedule_config: JSON.stringify({
            interval: 1,
            day_of_month: 1,
            time: '09:00'
          }),
          timezone: 'Asia/Riyadh',
          is_active: true,
          next_execution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // بعد شهر
        },
        {
          name: 'مراجعة أسبوعية للمشاريع',
          description: 'إنشاء تذكرة مراجعة أسبوعية لحالة المشاريع',
          process_id: processesResult.rows[1]?.id || processesResult.rows[0].id,
          template_data: JSON.stringify({
            title: 'مراجعة أسبوعية - الأسبوع {{week_number}}',
            description: 'مراجعة حالة جميع المشاريع الجارية والتقدم المحرز',
            priority: 'high',
            data: {
              review_type: 'weekly_projects',
              department: 'project_management'
            }
          }),
          schedule_type: 'weekly',
          schedule_config: JSON.stringify({
            interval: 1,
            days_of_week: [1], // الاثنين
            time: '10:00'
          }),
          timezone: 'Asia/Riyadh',
          is_active: true,
          next_execution: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // بعد أسبوع
        },
        {
          name: 'نسخ احتياطي يومي',
          description: 'إنشاء تذكرة للتحقق من النسخ الاحتياطية اليومية',
          process_id: processesResult.rows[2]?.id || processesResult.rows[0].id,
          template_data: JSON.stringify({
            title: 'فحص النسخ الاحتياطية - {{current_date}}',
            description: 'التحقق من نجاح عمليات النسخ الاحتياطي اليومية',
            priority: 'medium',
            data: {
              task_type: 'backup_check',
              department: 'it'
            }
          }),
          schedule_type: 'daily',
          schedule_config: JSON.stringify({
            interval: 1,
            time: '08:00'
          }),
          timezone: 'Asia/Riyadh',
          is_active: true,
          next_execution: new Date(Date.now() + 24 * 60 * 60 * 1000) // غداً
        }
      ];
      
      for (const rule of recurringRules) {
        await client.query(`
          INSERT INTO recurring_rules (
            name, description, process_id, template_data, schedule_type,
            schedule_config, timezone, is_active, next_execution, execution_count, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          rule.name, rule.description, rule.process_id, rule.template_data,
          rule.schedule_type, rule.schedule_config, rule.timezone, rule.is_active,
          rule.next_execution, Math.floor(Math.random() * 20), usersResult.rows[0]?.id || null
        ]);
      }
    }
    
    // 3. إضافة تعليقات للتذاكر
    console.log('💬 إنشاء تعليقات التذاكر...');
    
    const ticketsResult = await client.query('SELECT id FROM tickets LIMIT 5');
    
    if (ticketsResult.rows.length > 0 && usersResult.rows.length > 0) {
      const comments = [
        {
          ticket_id: ticketsResult.rows[0].id,
          user_id: usersResult.rows[0].id,
          content: 'تم مراجعة الطلب وهو جاهز للموافقة النهائية. جميع المستندات مكتملة.',
          is_internal: false
        },
        {
          ticket_id: ticketsResult.rows[0].id,
          user_id: usersResult.rows[1]?.id || usersResult.rows[0].id,
          content: 'ملاحظة داخلية: يحتاج إلى مراجعة إضافية من قسم المالية',
          is_internal: true
        },
        {
          ticket_id: ticketsResult.rows[1]?.id || ticketsResult.rows[0].id,
          user_id: usersResult.rows[0].id,
          content: 'شكراً لكم على سرعة الاستجابة. الطلب واضح ومفهوم.',
          is_internal: false
        },
        {
          ticket_id: ticketsResult.rows[2]?.id || ticketsResult.rows[0].id,
          user_id: usersResult.rows[1]?.id || usersResult.rows[0].id,
          content: 'تم التواصل مع العميل وتأكيد المتطلبات. سيتم البدء في التنفيذ غداً.',
          is_internal: false
        },
        {
          ticket_id: ticketsResult.rows[3]?.id || ticketsResult.rows[0].id,
          user_id: usersResult.rows[2]?.id || usersResult.rows[0].id,
          content: 'تحديث: تم حل المشكلة الفنية وإعادة تشغيل النظام بنجاح.',
          is_internal: false
        }
      ];
      
      for (const comment of comments) {
        await client.query(`
          INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
          VALUES ($1, $2, $3, $4)
        `, [comment.ticket_id, comment.user_id, comment.content, comment.is_internal]);
      }
    }
    
    // 4. إضافة مرفقات وهمية
    console.log('📎 إنشاء مرفقات التذاكر...');
    
    if (ticketsResult.rows.length > 0 && usersResult.rows.length > 0) {
      const attachments = [
        {
          ticket_id: ticketsResult.rows[0].id,
          filename: 'contract_2024_001.pdf',
          original_filename: 'عقد الخدمة 2024.pdf',
          file_path: '/uploads/contracts/contract_2024_001.pdf',
          file_size: 2048576, // 2MB
          mime_type: 'application/pdf',
          uploaded_by: usersResult.rows[0].id
        },
        {
          ticket_id: ticketsResult.rows[1]?.id || ticketsResult.rows[0].id,
          filename: 'requirements_doc.docx',
          original_filename: 'متطلبات المشروع.docx',
          file_path: '/uploads/documents/requirements_doc.docx',
          file_size: 1024000, // 1MB
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          uploaded_by: usersResult.rows[1]?.id || usersResult.rows[0].id
        },
        {
          ticket_id: ticketsResult.rows[2]?.id || ticketsResult.rows[0].id,
          filename: 'budget_sheet.xlsx',
          original_filename: 'جدول الميزانية.xlsx',
          file_path: '/uploads/spreadsheets/budget_sheet.xlsx',
          file_size: 512000, // 512KB
          mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          uploaded_by: usersResult.rows[0].id
        }
      ];
      
      for (const attachment of attachments) {
        await client.query(`
          INSERT INTO ticket_attachments (
            ticket_id, filename, original_filename, file_path, file_size,
            mime_type, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          attachment.ticket_id, attachment.filename, attachment.original_filename,
          attachment.file_path, attachment.file_size, attachment.mime_type,
          attachment.uploaded_by
        ]);
      }
    }
    
    // 5. إضافة سجلات تدقيق
    console.log('🔍 إنشاء سجلات التدقيق...');
    
    if (usersResult.rows.length > 0 && ticketsResult.rows.length > 0) {
      const auditLogs = [
        {
          user_id: usersResult.rows[0].id,
          action_type: 'create',
          resource_type: 'ticket',
          resource_id: ticketsResult.rows[0].id,
          description: 'تم إنشاء تذكرة جديدة للدعم الفني',
          new_values: JSON.stringify({
            title: 'طلب دعم فني',
            priority: 'medium',
            status: 'open'
          }),
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          user_id: usersResult.rows[1]?.id || usersResult.rows[0].id,
          action_type: 'update',
          resource_type: 'ticket',
          resource_id: ticketsResult.rows[0].id,
          description: 'تم تحديث أولوية التذكرة من متوسطة إلى عالية',
          old_values: JSON.stringify({ priority: 'medium' }),
          new_values: JSON.stringify({ priority: 'high' }),
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        {
          user_id: usersResult.rows[0].id,
          action_type: 'login',
          resource_type: 'user',
          resource_id: usersResult.rows[0].id,
          description: 'تسجيل دخول ناجح للنظام',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          user_id: usersResult.rows[2]?.id || usersResult.rows[0].id,
          action_type: 'export',
          resource_type: 'ticket',
          resource_id: null,
          description: 'تم تصدير تقرير التذاكر الشهري',
          new_values: JSON.stringify({
            export_type: 'monthly_report',
            format: 'pdf',
            records_count: 150
          }),
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        }
      ];
      
      for (const log of auditLogs) {
        await client.query(`
          INSERT INTO audit_logs (
            user_id, action, resource_type, resource_id,
            old_values, new_values, ip_address, user_agent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          log.user_id, log.action_type, log.resource_type, log.resource_id,
          log.old_values, log.new_values, log.ip_address, log.user_agent
        ]);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ تم إنشاء جميع البيانات التجريبية الموسعة بنجاح!');
    
    // عرض ملخص البيانات المنشأة
    const summary = await client.query(`
      SELECT 
        'automation_rules' as table_name,
        COUNT(*) as count
      FROM automation_rules
      UNION ALL
      SELECT 'recurring_rules', COUNT(*) FROM recurring_rules
      UNION ALL
      SELECT 'ticket_comments', COUNT(*) FROM ticket_comments
      UNION ALL
      SELECT 'ticket_attachments', COUNT(*) FROM ticket_attachments
      UNION ALL
      SELECT 'audit_logs', COUNT(*) FROM audit_logs
      ORDER BY table_name
    `);
    
    console.log('\n📊 ملخص البيانات المنشأة:');
    summary.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} سجل`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  createExtendedDemoData()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من إنشاء البيانات التجريبية الموسعة!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 فشل في إنشاء البيانات التجريبية:', error);
      process.exit(1);
    });
}

module.exports = { createExtendedDemoData };
