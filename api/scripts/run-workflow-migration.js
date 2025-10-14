const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runWorkflowMigration() {
  try {
    console.log('🔄 بدء تشغيل migration نظام إدارة العمليات...');
    
    // قراءة ملف الـ migration
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_create_workflow_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // تشغيل الـ migration
    await pool.query(migrationSQL);
    
    console.log('✅ تم تشغيل migration نظام إدارة العمليات بنجاح!');
    
    // إضافة بيانات تجريبية
    console.log('🔄 إضافة بيانات تجريبية...');
    
    // إنشاء عملية تجريبية
    const processResult = await pool.query(`
      INSERT INTO processes (name, description, color, icon, created_by)
      SELECT 'تذاكر الدعم الفني', 'نظام إدارة تذاكر الدعم الفني', '#3B82F6', 'Support', id
      FROM users WHERE email = 'admin@example.com'
      RETURNING *
    `);
    
    if (processResult.rows.length > 0) {
      const processId = processResult.rows[0].id;
      console.log('✅ تم إنشاء عملية تجريبية:', processResult.rows[0].name);
      
      // إنشاء مراحل تجريبية
      const stages = [
        { name: 'جديدة', color: '#6B7280', order_index: 1, priority: 1, is_initial: true },
        { name: 'قيد المعالجة', color: '#F59E0B', order_index: 2, priority: 2 },
        { name: 'محلولة', color: '#10B981', order_index: 3, priority: 3, is_final: true }
      ];
      
      const stageIds = [];
      for (let stage of stages) {
        const stageResult = await pool.query(`
          INSERT INTO stages (process_id, name, color, order_index, priority, is_initial, is_final)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [processId, stage.name, stage.color, stage.order_index, stage.priority, stage.is_initial || false, stage.is_final || false]);
        
        stageIds.push(stageResult.rows[0].id);
      }
      
      console.log('✅ تم إنشاء المراحل التجريبية');
      
      // إنشاء انتقالات بين المراحل
      if (stageIds.length >= 2) {
        // من المرحلة الأولى إلى الثانية
        await pool.query(`
          INSERT INTO stage_transitions (from_stage_id, to_stage_id, display_name, is_default, order_index)
          VALUES ($1, $2, 'إرسال للمعالجة', true, 1)
        `, [stageIds[0], stageIds[1]]);
        
        // من الثانية إلى الثالثة
        await pool.query(`
          INSERT INTO stage_transitions (from_stage_id, to_stage_id, display_name, is_default, order_index)
          VALUES ($1, $2, 'حل المشكلة', true, 1)
        `, [stageIds[1], stageIds[2]]);
        
        // من الثانية إلى الأولى (رفض)
        await pool.query(`
          INSERT INTO stage_transitions (from_stage_id, to_stage_id, display_name, button_color, order_index)
          VALUES ($1, $2, 'إعادة فتح', '#EF4444', 2)
        `, [stageIds[1], stageIds[0]]);
        
        console.log('✅ تم إنشاء الانتقالات بين المراحل');
      }
      
      // إنشاء حقول تجريبية
      const fields = [
        { 
          name: 'title', 
          label: 'العنوان', 
          field_type: 'text', 
          is_required: true, 
          is_system_field: true,
          order_index: 1,
          placeholder: 'أدخل عنوان التذكرة'
        },
        { 
          name: 'description', 
          label: 'الوصف', 
          field_type: 'textarea', 
          is_required: false, 
          is_system_field: true,
          order_index: 2,
          placeholder: 'أدخل وصف مفصل للمشكلة'
        },
        { 
          name: 'priority', 
          label: 'الأولوية', 
          field_type: 'select', 
          is_required: true, 
          is_system_field: true,
          order_index: 3,
          default_value: JSON.stringify('medium'),
          options: JSON.stringify([
            { value: 'low', label: 'منخفضة', color: '#10B981' },
            { value: 'medium', label: 'متوسطة', color: '#F59E0B' },
            { value: 'high', label: 'عالية', color: '#EF4444' },
            { value: 'urgent', label: 'عاجلة', color: '#DC2626' }
          ])
        },
        {
          name: 'issue_type',
          label: 'نوع المشكلة',
          field_type: 'select',
          is_required: true,
          order_index: 4,
          options: JSON.stringify([
            { value: 'technical', label: 'مشكلة تقنية' },
            { value: 'billing', label: 'مشكلة في الفوترة' },
            { value: 'account', label: 'مشكلة في الحساب' },
            { value: 'feature', label: 'طلب ميزة جديدة' }
          ])
        },
        {
          name: 'due_date',
          label: 'تاريخ الاستحقاق',
          field_type: 'date',
          is_required: false,
          is_system_field: true,
          order_index: 5
        }
      ];
      
      for (let field of fields) {
        await pool.query(`
          INSERT INTO process_fields (
            process_id, name, label, field_type, is_required, is_system_field,
            order_index, placeholder, default_value, options
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          processId, 
          field.name, 
          field.label, 
          field.field_type, 
          field.is_required, 
          field.is_system_field || false,
          field.order_index,
          field.placeholder || null,
          field.default_value || null,
          field.options || '[]'
        ]);
      }
      
      console.log('✅ تم إنشاء الحقول التجريبية');
      
      // إنشاء تذكرة تجريبية
      const ticketNumber = await pool.query(`SELECT generate_ticket_number($1) as ticket_number`, [processId]);
      const initialStage = await pool.query(`SELECT id FROM stages WHERE process_id = $1 AND is_initial = true LIMIT 1`, [processId]);
      
      if (initialStage.rows.length > 0) {
        const ticketResult = await pool.query(`
          INSERT INTO tickets (
            ticket_number, title, description, process_id, current_stage_id, 
            created_by, priority, data
          )
          SELECT $1, 'تذكرة تجريبية', 'هذه تذكرة تجريبية لاختبار النظام', $2, $3, id, 'medium', $4
          FROM users WHERE email = 'admin@example.com'
          RETURNING *
        `, [
          ticketNumber.rows[0].ticket_number,
          processId,
          initialStage.rows[0].id,
          JSON.stringify({
            title: 'تذكرة تجريبية',
            description: 'هذه تذكرة تجريبية لاختبار النظام',
            priority: 'medium',
            issue_type: 'technical'
          })
        ]);
        
        if (ticketResult.rows.length > 0) {
          console.log('✅ تم إنشاء تذكرة تجريبية:', ticketResult.rows[0].ticket_number);
          
          // إضافة نشاط إنشاء التذكرة
          await pool.query(`
            INSERT INTO ticket_activities (ticket_id, user_id, activity_type, description, new_values)
            SELECT $1, id, 'created', 'تم إنشاء التذكرة', $2
            FROM users WHERE email = 'admin@example.com'
          `, [
            ticketResult.rows[0].id,
            JSON.stringify({ title: 'تذكرة تجريبية', priority: 'medium' })
          ]);
          
          console.log('✅ تم إضافة نشاط التذكرة');
        }
      }
    }
    
    // إنشاء عملية ثانية من قالب الموارد البشرية
    console.log('🔄 إنشاء عملية الموارد البشرية...');
    
    const hrProcessResult = await pool.query(`
      INSERT INTO processes (name, description, color, icon, created_by)
      SELECT 'طلبات الموارد البشرية', 'نظام إدارة طلبات الموارد البشرية', '#10B981', 'Users', id
      FROM users WHERE email = 'admin@example.com'
      RETURNING *
    `);
    
    if (hrProcessResult.rows.length > 0) {
      const hrProcessId = hrProcessResult.rows[0].id;
      console.log('✅ تم إنشاء عملية الموارد البشرية');
      
      // إنشاء مراحل الموارد البشرية
      const hrStages = [
        { name: 'طلب جديد', color: '#6B7280', order_index: 1, priority: 1, is_initial: true },
        { name: 'مراجعة المدير', color: '#F59E0B', order_index: 2, priority: 2 },
        { name: 'مراجعة الموارد البشرية', color: '#8B5CF6', order_index: 3, priority: 3 },
        { name: 'معتمد', color: '#10B981', order_index: 4, priority: 4, is_final: true },
        { name: 'مرفوض', color: '#EF4444', order_index: 5, priority: 5, is_final: true }
      ];
      
      for (let stage of hrStages) {
        await pool.query(`
          INSERT INTO stages (process_id, name, color, order_index, priority, is_initial, is_final)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [hrProcessId, stage.name, stage.color, stage.order_index, stage.priority, stage.is_initial || false, stage.is_final || false]);
      }
      
      console.log('✅ تم إنشاء مراحل الموارد البشرية');
    }
    
    console.log('🎉 تم إعداد نظام إدارة العمليات بالكامل!');
    console.log('');
    console.log('📊 ملخص ما تم إنشاؤه:');
    console.log('- جداول قاعدة البيانات الكاملة');
    console.log('- عملية تذاكر الدعم الفني مع 3 مراحل');
    console.log('- عملية طلبات الموارد البشرية مع 5 مراحل');
    console.log('- حقول مخصصة لكل عملية');
    console.log('- انتقالات ذكية بين المراحل');
    console.log('- تذكرة تجريبية للاختبار');
    console.log('- دوال مساعدة لتوليد أرقام التذاكر');
    console.log('');
    console.log('🚀 يمكنك الآن استخدام النظام من خلال:');
    console.log('- Swagger UI: http://localhost:3003/api-docs');
    console.log('- API Endpoints: /api/processes, /api/tickets, /api/stages');
    
  } catch (error) {
    console.error('❌ خطأ في تشغيل migration:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    await pool.end();
  }
}

// تشغيل الـ migration
runWorkflowMigration();
