const { pool } = require('../config/database');
const WorkflowService = require('../services/WorkflowService');

async function createDemoData() {
  console.log('🚀 بدء إنشاء البيانات التجريبية...');

  try {
    // الحصول على معرف المستخدم الإداري
    const adminUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@pipefy.com']
    );

    if (adminUser.rows.length === 0) {
      throw new Error('لم يتم العثور على المستخدم الإداري');
    }

    const adminUserId = adminUser.rows[0].id;
    console.log(`👤 تم العثور على المستخدم الإداري: ${adminUserId}`);

    // إنشاء عملية دعم فني
    console.log('📞 إنشاء عملية الدعم الفني...');
    const supportResult = await WorkflowService.createFromTemplate('support_ticket', {
      name: 'نظام الدعم الفني المتقدم',
      description: 'نظام شامل لإدارة تذاكر الدعم الفني والمساعدة',
      color: '#2563EB',
      icon: 'Headphones'
    }, adminUserId);
    const supportProcess = supportResult.process;
    console.log(`✅ تم إنشاء عملية الدعم الفني: ${supportProcess.id}`);

    // إنشاء عملية الموارد البشرية
    console.log('👥 إنشاء عملية الموارد البشرية...');
    const hrResult = await WorkflowService.createFromTemplate('hr_request', {
      name: 'طلبات الموارد البشرية',
      description: 'نظام إدارة طلبات الإجازات والتدريب والمعدات',
      color: '#059669',
      icon: 'Users'
    }, adminUserId);
    const hrProcess = hrResult.process;
    console.log(`✅ تم إنشاء عملية الموارد البشرية: ${hrProcess.id}`);

    // إنشاء عملية طلبات الشراء
    console.log('🛒 إنشاء عملية طلبات الشراء...');
    const purchaseResult = await WorkflowService.createFromTemplate('purchase_request', {
      name: 'طلبات الشراء والمعدات',
      description: 'نظام إدارة طلبات الشراء والموافقات المالية',
      color: '#DC2626',
      icon: 'ShoppingCart'
    }, adminUserId);
    const purchaseProcess = purchaseResult.process;
    console.log(`✅ تم إنشاء عملية طلبات الشراء: ${purchaseProcess.id}`);

    // إنشاء عملية مخصصة للمشاريع
    console.log('📋 إنشاء عملية إدارة المشاريع...');
    const projectProcess = await pool.query(`
      INSERT INTO processes (name, description, color, icon, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      'إدارة المشاريع',
      'نظام متكامل لإدارة المشاريع والمهام',
      '#7C3AED',
      'Briefcase',
      true,
      adminUserId
    ]);
    
    const projectProcessId = projectProcess.rows[0].id;
    console.log(`✅ تم إنشاء عملية إدارة المشاريع: ${projectProcessId}`);

    // إنشاء مراحل للمشاريع
    const projectStages = [
      { name: 'تخطيط المشروع', color: '#6B7280', order_index: 1, priority: 1, is_initial: true },
      { name: 'قيد التنفيذ', color: '#F59E0B', order_index: 2, priority: 2 },
      { name: 'مراجعة الجودة', color: '#3B82F6', order_index: 3, priority: 3 },
      { name: 'اختبار المشروع', color: '#8B5CF6', order_index: 4, priority: 4 },
      { name: 'مكتمل', color: '#10B981', order_index: 5, priority: 5, is_final: true }
    ];

    for (const stage of projectStages) {
      await pool.query(`
        INSERT INTO stages (process_id, name, description, color, order_index, priority, is_initial, is_final, sla_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        projectProcessId,
        stage.name,
        `مرحلة ${stage.name} في دورة حياة المشروع`,
        stage.color,
        stage.order_index,
        stage.priority,
        stage.is_initial || false,
        stage.is_final || false,
        stage.order_index === 1 ? 48 : stage.order_index === 5 ? null : 72
      ]);
    }

    // إنشاء حقول للمشاريع
    const projectFields = [
      {
        name: 'project_name',
        label: 'اسم المشروع',
        field_type: 'text',
        is_required: true,
        order_index: 1,
        group_name: 'معلومات أساسية'
      },
      {
        name: 'project_manager',
        label: 'مدير المشروع',
        field_type: 'user',
        is_required: true,
        order_index: 2,
        group_name: 'معلومات أساسية'
      },
      {
        name: 'start_date',
        label: 'تاريخ البداية',
        field_type: 'date',
        is_required: true,
        order_index: 3,
        group_name: 'التواريخ'
      },
      {
        name: 'end_date',
        label: 'تاريخ النهاية المتوقع',
        field_type: 'date',
        is_required: true,
        order_index: 4,
        group_name: 'التواريخ'
      },
      {
        name: 'budget',
        label: 'الميزانية',
        field_type: 'currency',
        is_required: false,
        order_index: 5,
        group_name: 'المالية'
      },
      {
        name: 'priority',
        label: 'الأولوية',
        field_type: 'select',
        is_required: true,
        order_index: 6,
        group_name: 'معلومات أساسية',
        options: [
          { value: 'low', label: 'منخفضة' },
          { value: 'medium', label: 'متوسطة' },
          { value: 'high', label: 'عالية' },
          { value: 'urgent', label: 'عاجلة' }
        ]
      }
    ];

    for (const field of projectFields) {
      await pool.query(`
        INSERT INTO process_fields (process_id, name, label, field_type, is_required, order_index, group_name, options)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        projectProcessId,
        field.name,
        field.label,
        field.field_type,
        field.is_required,
        field.order_index,
        field.group_name,
        field.options ? JSON.stringify(field.options) : null
      ]);
    }

    console.log('✅ تم إنشاء مراحل وحقول المشاريع');

    // إنشاء تذاكر تجريبية
    console.log('🎫 إنشاء تذاكر تجريبية...');
    
    // تذاكر الدعم الفني
    const supportTickets = [
      {
        title: 'مشكلة في تسجيل الدخول',
        description: 'العميل لا يستطيع تسجيل الدخول إلى النظام',
        priority: 'high',
        data: {
          issue_type: 'technical',
          severity: 'high',
          customer_email: 'customer1@example.com'
        }
      },
      {
        title: 'طلب تحديث البيانات',
        description: 'العميل يريد تحديث معلومات الحساب',
        priority: 'medium',
        data: {
          issue_type: 'account',
          severity: 'medium',
          customer_email: 'customer2@example.com'
        }
      },
      {
        title: 'مشكلة في الدفع',
        description: 'فشل في عملية الدفع الإلكتروني',
        priority: 'urgent',
        data: {
          issue_type: 'billing',
          severity: 'high',
          customer_email: 'customer3@example.com'
        }
      }
    ];

    for (let i = 0; i < supportTickets.length; i++) {
      const ticket = supportTickets[i];
      const ticketNumber = `SUP-${String(i + 1).padStart(6, '0')}`;
      const initialStage = await pool.query(
        'SELECT id FROM stages WHERE process_id = $1 AND is_initial = true',
        [supportProcess.id]
      );

      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, process_id, current_stage_id,
                           priority, status, data, created_by, assigned_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        ticketNumber,
        ticket.title,
        ticket.description,
        supportProcess.id,
        initialStage.rows[0].id,
        ticket.priority,
        'active',
        JSON.stringify(ticket.data),
        adminUserId, // admin user
        adminUserId  // assigned to admin
      ]);
    }

    // تذاكر الموارد البشرية
    const hrTickets = [
      {
        title: 'طلب إجازة سنوية',
        description: 'طلب إجازة سنوية لمدة أسبوعين',
        priority: 'medium',
        data: {
          request_type: 'vacation',
          start_date: '2024-12-25',
          end_date: '2025-01-08'
        }
      },
      {
        title: 'طلب دورة تدريبية',
        description: 'طلب حضور دورة في إدارة المشاريع',
        priority: 'low',
        data: {
          request_type: 'training',
          course_name: 'إدارة المشاريع المتقدمة',
          duration: '5 أيام'
        }
      }
    ];

    for (let i = 0; i < hrTickets.length; i++) {
      const ticket = hrTickets[i];
      const ticketNumber = `HR-${String(i + 1).padStart(6, '0')}`;
      const initialStage = await pool.query(
        'SELECT id FROM stages WHERE process_id = $1 AND is_initial = true',
        [hrProcess.id]
      );

      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, process_id, current_stage_id,
                           priority, status, data, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        ticketNumber,
        ticket.title,
        ticket.description,
        hrProcess.id,
        initialStage.rows[0].id,
        ticket.priority,
        'active',
        JSON.stringify(ticket.data),
        adminUserId // admin user
      ]);
    }

    // تذاكر طلبات الشراء
    const purchaseTickets = [
      {
        title: 'شراء أجهزة كمبيوتر',
        description: 'طلب شراء 5 أجهزة كمبيوتر للفريق الجديد',
        priority: 'medium',
        data: {
          item_name: 'Dell OptiPlex 7090',
          quantity: 5,
          unit_price: 800,
          total_amount: 4000
        }
      }
    ];

    for (let i = 0; i < purchaseTickets.length; i++) {
      const ticket = purchaseTickets[i];
      const ticketNumber = `PUR-${String(i + 1).padStart(6, '0')}`;
      const initialStage = await pool.query(
        'SELECT id FROM stages WHERE process_id = $1 AND is_initial = true',
        [purchaseProcess.id]
      );

      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, process_id, current_stage_id,
                           priority, status, data, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        ticketNumber,
        ticket.title,
        ticket.description,
        purchaseProcess.id,
        initialStage.rows[0].id,
        ticket.priority,
        'active',
        JSON.stringify(ticket.data),
        adminUserId // admin user
      ]);
    }

    console.log('✅ تم إنشاء التذاكر التجريبية');

    console.log('\n🎉 تم إنشاء جميع البيانات التجريبية بنجاح!');
    console.log('\n📊 ملخص البيانات المنشأة:');
    console.log('- 4 عمليات (دعم فني، موارد بشرية، طلبات شراء، إدارة مشاريع)');
    console.log('- مراحل وحقول لكل عملية');
    console.log('- 6 تذاكر تجريبية');
    console.log('\n🔗 يمكنك الآن اختبار النظام من خلال:');
    console.log('- Swagger UI: http://localhost:3000/api-docs');
    console.log('- API Endpoints: /api/processes, /api/tickets');

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
    throw error;
  }
}

// تشغيل الدالة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  createDemoData()
    .then(() => {
      console.log('✅ تم الانتهاء من إنشاء البيانات التجريبية');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في إنشاء البيانات التجريبية:', error);
      process.exit(1);
    });
}

module.exports = { createDemoData };
