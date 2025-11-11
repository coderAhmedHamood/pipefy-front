const { pool } = require('../config/database');
const WorkflowService = require('../services/WorkflowService');

async function createComprehensiveDemo() {
  console.log('🚀 بدء إنشاء البيانات التجريبية الشاملة...');
  
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

    // حذف البيانات القديمة
    console.log('🧹 تنظيف البيانات القديمة...');
    await pool.query('DELETE FROM ticket_activities');
    await pool.query('DELETE FROM tickets');
    await pool.query('DELETE FROM stage_transitions');
    await pool.query('DELETE FROM process_fields');
    await pool.query('DELETE FROM stages');
    await pool.query('DELETE FROM processes');
    console.log('✅ تم تنظيف البيانات القديمة');

    // إنشاء عمليات شاملة
    const processes = [];

    // 1. نظام الدعم الفني المتقدم
    console.log('📞 إنشاء نظام الدعم الفني المتقدم...');
    const supportResult = await WorkflowService.createFromTemplate('support_ticket', {
      name: 'نظام الدعم الفني المتقدم',
      description: 'نظام شامل لإدارة تذاكر الدعم الفني مع تتبع متقدم للأداء',
      color: '#2563EB',
      icon: 'Headphones'
    }, adminUserId);
    processes.push({ name: 'support', data: supportResult.process });
    console.log(`✅ تم إنشاء نظام الدعم الفني: ${supportResult.process.id}`);

    // 2. إدارة الموارد البشرية
    console.log('👥 إنشاء نظام إدارة الموارد البشرية...');
    const hrResult = await WorkflowService.createFromTemplate('hr_request', {
      name: 'إدارة الموارد البشرية',
      description: 'نظام متكامل لإدارة طلبات الموظفين والإجازات والتدريب',
      color: '#059669',
      icon: 'Users'
    }, adminUserId);
    processes.push({ name: 'hr', data: hrResult.process });
    console.log(`✅ تم إنشاء نظام الموارد البشرية: ${hrResult.process.id}`);

    // 3. إدارة المشتريات والمعدات
    console.log('🛒 إنشاء نظام إدارة المشتريات...');
    const purchaseResult = await WorkflowService.createFromTemplate('purchase_request', {
      name: 'إدارة المشتريات والمعدات',
      description: 'نظام إدارة طلبات الشراء مع الموافقات المالية المتدرجة',
      color: '#DC2626',
      icon: 'ShoppingCart'
    }, adminUserId);
    processes.push({ name: 'purchase', data: purchaseResult.process });
    console.log(`✅ تم إنشاء نظام المشتريات: ${purchaseResult.process.id}`);

    // 4. إدارة المشاريع
    console.log('📋 إنشاء نظام إدارة المشاريع...');
    const projectProcess = await pool.query(`
      INSERT INTO processes (name, description, color, icon, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      'إدارة المشاريع والمهام',
      'نظام متكامل لإدارة دورة حياة المشاريع من التخطيط إلى التسليم',
      '#7C3AED',
      'Briefcase',
      true,
      adminUserId
    ]);
    
    const projectProcessId = projectProcess.rows[0].id;
    console.log(`✅ تم إنشاء نظام إدارة المشاريع: ${projectProcessId}`);

    // إنشاء مراحل المشاريع
    const projectStages = [
      { name: 'تخطيط المشروع', color: '#6B7280', order_index: 1, priority: 1, is_initial: true, sla_hours: 48 },
      { name: 'بدء التنفيذ', color: '#F59E0B', order_index: 2, priority: 2, sla_hours: 72 },
      { name: 'قيد التطوير', color: '#3B82F6', order_index: 3, priority: 3, sla_hours: 168 },
      { name: 'مراجعة الجودة', color: '#8B5CF6', order_index: 4, priority: 4, sla_hours: 48 },
      { name: 'اختبار المشروع', color: '#F97316', order_index: 5, priority: 5, sla_hours: 72 },
      { name: 'جاهز للتسليم', color: '#06B6D4', order_index: 6, priority: 6, sla_hours: 24 },
      { name: 'مكتمل', color: '#10B981', order_index: 7, priority: 7, is_final: true }
    ];

    const createdProjectStages = [];
    for (const stage of projectStages) {
      const result = await pool.query(`
        INSERT INTO stages (process_id, name, description, color, order_index, priority, is_initial, is_final, sla_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        projectProcessId,
        stage.name,
        `مرحلة ${stage.name} في دورة حياة المشروع`,
        stage.color,
        stage.order_index,
        stage.priority,
        stage.is_initial || false,
        stage.is_final || false,
        stage.sla_hours
      ]);
      createdProjectStages.push(result.rows[0]);
    }

    // إنشاء حقول المشاريع
    const projectFields = [
      {
        name: 'project_name',
        label: 'اسم المشروع',
        field_type: 'text',
        is_required: true,
        order_index: 1,
        group_name: 'معلومات أساسية',
        placeholder: 'أدخل اسم المشروع',
        validation_rules: { min_length: 3, max_length: 100 }
      },
      {
        name: 'project_manager',
        label: 'مدير المشروع',
        field_type: 'user',
        is_required: true,
        order_index: 2,
        group_name: 'معلومات أساسية',
        help_text: 'اختر مدير المشروع المسؤول'
      },
      {
        name: 'project_type',
        label: 'نوع المشروع',
        field_type: 'select',
        is_required: true,
        order_index: 3,
        group_name: 'معلومات أساسية',
        options: {
          choices: [
            { value: 'web_development', label: 'تطوير ويب' },
            { value: 'mobile_app', label: 'تطبيق جوال' },
            { value: 'infrastructure', label: 'بنية تحتية' },
            { value: 'data_analysis', label: 'تحليل بيانات' },
            { value: 'marketing', label: 'تسويق' },
            { value: 'other', label: 'أخرى' }
          ]
        }
      },
      {
        name: 'start_date',
        label: 'تاريخ البداية',
        field_type: 'date',
        is_required: true,
        order_index: 4,
        group_name: 'التواريخ',
        help_text: 'تاريخ بداية المشروع المخطط'
      },
      {
        name: 'end_date',
        label: 'تاريخ النهاية المتوقع',
        field_type: 'date',
        is_required: true,
        order_index: 5,
        group_name: 'التواريخ',
        help_text: 'تاريخ انتهاء المشروع المتوقع'
      },
      {
        name: 'budget',
        label: 'الميزانية المخصصة',
        field_type: 'currency',
        is_required: false,
        order_index: 6,
        group_name: 'المالية',
        placeholder: '0.00',
        help_text: 'الميزانية الإجمالية للمشروع'
      },
      {
        name: 'priority',
        label: 'أولوية المشروع',
        field_type: 'select',
        is_required: true,
        order_index: 7,
        group_name: 'معلومات أساسية',
        options: {
          choices: [
            { value: 'urgent', label: 'عاجل' },
            { value: 'high', label: 'عالية' },
            { value: 'medium', label: 'متوسطة' },
            { value: 'low', label: 'منخفضة' }
          ]
        },
        default_value: 'medium'
      },
      {
        name: 'team_size',
        label: 'حجم الفريق',
        field_type: 'number',
        is_required: false,
        order_index: 8,
        group_name: 'الفريق',
        validation_rules: { min: 1, max: 50 },
        help_text: 'عدد أعضاء الفريق المطلوب'
      },
      {
        name: 'description',
        label: 'وصف المشروع',
        field_type: 'textarea',
        is_required: true,
        order_index: 9,
        group_name: 'التفاصيل',
        placeholder: 'اكتب وصفاً مفصلاً للمشروع...',
        validation_rules: { min_length: 10, max_length: 1000 }
      },
      {
        name: 'technologies',
        label: 'التقنيات المستخدمة',
        field_type: 'multiselect',
        is_required: false,
        order_index: 10,
        group_name: 'التفاصيل',
        options: {
          choices: [
            { value: 'javascript', label: 'JavaScript' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'react', label: 'React' },
            { value: 'nodejs', label: 'Node.js' },
            { value: 'postgresql', label: 'PostgreSQL' },
            { value: 'mongodb', label: 'MongoDB' },
            { value: 'aws', label: 'AWS' },
            { value: 'docker', label: 'Docker' }
          ]
        }
      }
    ];

    for (const field of projectFields) {
      await pool.query(`
        INSERT INTO process_fields (process_id, name, label, field_type, is_required, order_index, 
                                   group_name, options, validation_rules, help_text, placeholder, default_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        projectProcessId,
        field.name,
        field.label,
        field.field_type,
        field.is_required,
        field.order_index,
        field.group_name,
        field.options ? JSON.stringify(field.options) : null,
        field.validation_rules ? JSON.stringify(field.validation_rules) : null,
        field.help_text || null,
        field.placeholder || null,
        field.default_value ? JSON.stringify(field.default_value) : null
      ]);
    }

    processes.push({ 
      name: 'project', 
      data: { 
        id: projectProcessId, 
        name: 'إدارة المشاريع والمهام',
        stages: createdProjectStages
      } 
    });

    console.log('✅ تم إنشاء مراحل وحقول المشاريع');

    // 5. نظام إدارة العملاء (CRM)
    console.log('🤝 إنشاء نظام إدارة العملاء...');
    const crmProcess = await pool.query(`
      INSERT INTO processes (name, description, color, icon, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      'إدارة العملاء والمبيعات',
      'نظام إدارة علاقات العملاء وتتبع الفرص التجارية',
      '#EC4899',
      'Users',
      true,
      adminUserId
    ]);
    
    const crmProcessId = crmProcess.rows[0].id;

    // مراحل CRM
    const crmStages = [
      { name: 'عميل محتمل', color: '#6B7280', order_index: 1, priority: 1, is_initial: true },
      { name: 'تواصل أولي', color: '#F59E0B', order_index: 2, priority: 2 },
      { name: 'عرض سعر', color: '#3B82F6', order_index: 3, priority: 3 },
      { name: 'تفاوض', color: '#8B5CF6', order_index: 4, priority: 4 },
      { name: 'عقد موقع', color: '#10B981', order_index: 5, priority: 5, is_final: true }
    ];

    const createdCrmStages = [];
    for (const stage of crmStages) {
      const result = await pool.query(`
        INSERT INTO stages (process_id, name, description, color, order_index, priority, is_initial, is_final)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        crmProcessId,
        stage.name,
        `مرحلة ${stage.name} في دورة المبيعات`,
        stage.color,
        stage.order_index,
        stage.priority,
        stage.is_initial || false,
        stage.is_final || false
      ]);
      createdCrmStages.push(result.rows[0]);
    }

    processes.push({ 
      name: 'crm', 
      data: { 
        id: crmProcessId, 
        name: 'إدارة العملاء والمبيعات',
        stages: createdCrmStages
      } 
    });

    console.log(`✅ تم إنشاء نظام إدارة العملاء: ${crmProcessId}`);

    console.log('\n🎫 إنشاء تذاكر تجريبية شاملة...');

    // إنشاء تذاكر متنوعة لكل عملية
    const ticketData = {
      support: [
        {
          title: 'مشكلة في تسجيل الدخول - عميل VIP',
          description: 'العميل المميز لا يستطيع الوصول لحسابه منذ 3 ساعات. يحتاج حل عاجل.',
          priority: 'urgent',
          data: {
            customer_email: 'vip.customer@company.com',
            issue_type: 'technical',
            severity: 'high',
            browser: 'Chrome 120',
            error_message: 'Authentication failed',
            customer_tier: 'VIP',
            last_login: '2024-12-15T08:30:00Z'
          },
          tags: ['login', 'urgent', 'vip', 'authentication']
        },
        {
          title: 'طلب تحديث معلومات الحساب',
          description: 'العميل يريد تحديث بيانات الشركة وإضافة مستخدمين جدد',
          priority: 'medium',
          data: {
            customer_email: 'admin@techcorp.com',
            issue_type: 'account',
            severity: 'medium',
            requested_changes: ['company_name', 'billing_address', 'add_users'],
            new_users_count: 5
          },
          tags: ['account', 'update', 'users']
        },
        {
          title: 'فشل في عملية الدفع الشهرية',
          description: 'فشل في خصم الاشتراك الشهري. البطاقة الائتمانية منتهية الصلاحية.',
          priority: 'high',
          data: {
            customer_email: 'billing@startup.io',
            issue_type: 'billing',
            severity: 'high',
            payment_amount: 299.99,
            currency: 'USD',
            error_code: 'CARD_EXPIRED',
            subscription_plan: 'Professional'
          },
          tags: ['billing', 'payment', 'subscription', 'urgent']
        }
      ],
      hr: [
        {
          title: 'طلب إجازة سنوية - أحمد محمد',
          description: 'طلب إجازة سنوية لمدة أسبوعين للسفر مع العائلة',
          priority: 'medium',
          data: {
            request_type: 'vacation',
            employee_id: 'EMP001',
            start_date: '2024-12-25',
            end_date: '2025-01-08',
            days_requested: 14,
            remaining_vacation_days: 21,
            replacement_employee: 'سارة أحمد',
            reason: 'إجازة سنوية مع العائلة'
          },
          tags: ['vacation', 'annual_leave', 'approved']
        },
        {
          title: 'طلب دورة تدريبية في الذكاء الاصطناعي',
          description: 'طلب حضور مؤتمر AI Summit 2024 والحصول على شهادة معتمدة',
          priority: 'low',
          data: {
            request_type: 'training',
            employee_id: 'EMP002',
            course_name: 'AI Summit 2024',
            duration: '3 days',
            cost: 1500,
            currency: 'USD',
            location: 'Dubai, UAE',
            expected_benefits: 'تطوير مهارات الذكاء الاصطناعي'
          },
          tags: ['training', 'ai', 'conference', 'development']
        }
      ],
      purchase: [
        {
          title: 'شراء أجهزة كمبيوتر للفريق الجديد',
          description: 'طلب شراء 10 أجهزة كمبيوتر عالية الأداء للفريق التقني الجديد',
          priority: 'high',
          data: {
            item_name: 'Dell Precision 7000 Series',
            quantity: 10,
            unit_price: 2500,
            total_amount: 25000,
            currency: 'USD',
            supplier: 'Dell Technologies',
            delivery_date: '2024-12-30',
            justification: 'توسيع الفريق التقني',
            budget_code: 'IT-2024-Q4'
          },
          tags: ['hardware', 'computers', 'urgent', 'team_expansion']
        }
      ]
    };

    // إنشاء التذاكر
    let totalTickets = 0;
    for (const processInfo of processes) {
      if (ticketData[processInfo.name]) {
        const tickets = ticketData[processInfo.name];
        
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const ticketNumber = `${processInfo.name.toUpperCase()}-${String(i + 1).padStart(6, '0')}`;
          
          // العثور على المرحلة الأولى
          const initialStage = processInfo.data.stages?.find(s => s.is_initial) || 
                              (await pool.query(
                                'SELECT id FROM stages WHERE process_id = $1 AND is_initial = true LIMIT 1',
                                [processInfo.data.id]
                              )).rows[0];

          if (initialStage) {
            await pool.query(`
              INSERT INTO tickets (ticket_number, title, description, process_id, current_stage_id, 
                                 priority, status, data, created_by, assigned_to, tags, due_date)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              ticketNumber,
              ticket.title,
              ticket.description,
              processInfo.data.id,
              initialStage.id,
              ticket.priority,
              'active',
              JSON.stringify(ticket.data),
              adminUserId,
              adminUserId,
              ticket.tags,
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // أسبوع من الآن
            ]);
            
            totalTickets++;
          }
        }
      }
    }

    console.log(`✅ تم إنشاء ${totalTickets} تذكرة تجريبية`);

    console.log('\n🎉 تم إنشاء البيانات التجريبية الشاملة بنجاح!');
    console.log('\n📊 ملخص البيانات المنشأة:');
    console.log(`- ${processes.length} عمليات شاملة`);
    console.log(`- مراحل وحقول مفصلة لكل عملية`);
    console.log(`- ${totalTickets} تذكرة تجريبية متنوعة`);
    console.log('- انتقالات ذكية بين المراحل');
    console.log('- حقول ديناميكية متقدمة');
    console.log('\n🔗 يمكنك الآن اختبار النظام من خلال:');
    console.log('- Swagger UI: http://localhost:3004/api-docs');
    console.log('- API Endpoints: /api/processes, /api/stages, /api/fields, /api/tickets');

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل الدالة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  createComprehensiveDemo()
    .then(() => {
      console.log('✅ تم الانتهاء من إنشاء البيانات التجريبية الشاملة');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في إنشاء البيانات التجريبية:', error);
      process.exit(1);
    });
}

module.exports = { createComprehensiveDemo };
