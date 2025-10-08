const { pool } = require('./config/database');

async function seedEvaluationCriteria() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 بدء إضافة معايير التقييم الافتراضية...\n');

    // معايير تقييم قسم IT
    const itCriteria = [
      {
        name: 'Execution Speed',
        name_ar: 'سرعة التنفيذ',
        description: 'تقييم سرعة إنجاز المهمة',
        category: 'IT',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 1
      },
      {
        name: 'Code Quality',
        name_ar: 'جودة الكود',
        description: 'تقييم جودة الكود المكتوب',
        category: 'IT',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 2
      },
      {
        name: 'Team Collaboration',
        name_ar: 'التعاون مع الفريق',
        description: 'تقييم مدى التعاون مع أعضاء الفريق',
        category: 'IT',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: false,
        display_order: 3
      },
      {
        name: 'Reviewer Assessment',
        name_ar: 'تقييم المراجع',
        description: 'التقييم العام من المراجع',
        category: 'IT',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 4
      },
      {
        name: 'Documentation Quality',
        name_ar: 'جودة التوثيق',
        description: 'تقييم جودة التوثيق والتعليقات',
        category: 'IT',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: false,
        display_order: 5
      }
    ];

    // معايير تقييم قسم HR
    const hrCriteria = [
      {
        name: 'Response Time',
        name_ar: 'وقت الاستجابة',
        description: 'سرعة الرد على الطلبات',
        category: 'HR',
        options: JSON.stringify(['سريع جداً', 'سريع', 'متوسط', 'بطيء']),
        is_required: true,
        display_order: 1
      },
      {
        name: 'Service Quality',
        name_ar: 'جودة الخدمة',
        description: 'جودة الخدمة المقدمة',
        category: 'HR',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 2
      },
      {
        name: 'Communication Skills',
        name_ar: 'مهارات التواصل',
        description: 'تقييم مهارات التواصل',
        category: 'HR',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: false,
        display_order: 3
      },
      {
        name: 'Problem Resolution',
        name_ar: 'حل المشكلات',
        description: 'القدرة على حل المشكلات',
        category: 'HR',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 4
      }
    ];

    // معايير تقييم قسم Sales
    const salesCriteria = [
      {
        name: 'Customer Satisfaction',
        name_ar: 'رضا العميل',
        description: 'مدى رضا العميل عن الخدمة',
        category: 'Sales',
        options: JSON.stringify(['راضٍ جداً', 'راضٍ', 'محايد', 'غير راضٍ']),
        is_required: true,
        display_order: 1
      },
      {
        name: 'Sales Target Achievement',
        name_ar: 'تحقيق الهدف البيعي',
        description: 'مدى تحقيق الأهداف المحددة',
        category: 'Sales',
        options: JSON.stringify(['تجاوز الهدف', 'حقق الهدف', 'قريب من الهدف', 'لم يحقق الهدف']),
        is_required: true,
        display_order: 2
      },
      {
        name: 'Follow-up Quality',
        name_ar: 'جودة المتابعة',
        description: 'تقييم جودة متابعة العملاء',
        category: 'Sales',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 3
      }
    ];

    // معايير تقييم قسم Support
    const supportCriteria = [
      {
        name: 'Issue Resolution Speed',
        name_ar: 'سرعة حل المشكلة',
        description: 'الوقت المستغرق لحل المشكلة',
        category: 'Support',
        options: JSON.stringify(['سريع جداً', 'سريع', 'متوسط', 'بطيء']),
        is_required: true,
        display_order: 1
      },
      {
        name: 'Technical Knowledge',
        name_ar: 'المعرفة التقنية',
        description: 'مستوى المعرفة التقنية',
        category: 'Support',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 2
      },
      {
        name: 'Customer Communication',
        name_ar: 'التواصل مع العميل',
        description: 'جودة التواصل مع العميل',
        category: 'Support',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 3
      }
    ];

    // معايير تقييم عامة (General)
    const generalCriteria = [
      {
        name: 'Overall Performance',
        name_ar: 'الأداء العام',
        description: 'التقييم العام للأداء',
        category: 'General',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 1
      },
      {
        name: 'Deadline Adherence',
        name_ar: 'الالتزام بالمواعيد',
        description: 'مدى الالتزام بالمواعيد المحددة',
        category: 'General',
        options: JSON.stringify(['ممتاز', 'جيد', 'متأخر قليلاً', 'متأخر جداً']),
        is_required: true,
        display_order: 2
      },
      {
        name: 'Work Quality',
        name_ar: 'جودة العمل',
        description: 'جودة العمل المنجز',
        category: 'General',
        options: JSON.stringify(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف']),
        is_required: true,
        display_order: 3
      }
    ];

    // دمج جميع المعايير
    const allCriteria = [
      ...itCriteria,
      ...hrCriteria,
      ...salesCriteria,
      ...supportCriteria,
      ...generalCriteria
    ];

    console.log(`📊 إدراج ${allCriteria.length} معيار تقييم...\n`);

    for (const criteria of allCriteria) {
      await client.query(`
        INSERT INTO evaluation_criteria 
        (name, name_ar, description, category, options, is_required, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name, category) DO UPDATE SET
          name_ar = EXCLUDED.name_ar,
          description = EXCLUDED.description,
          options = EXCLUDED.options,
          is_required = EXCLUDED.is_required,
          display_order = EXCLUDED.display_order,
          updated_at = NOW()
      `, [
        criteria.name,
        criteria.name_ar,
        criteria.description,
        criteria.category,
        criteria.options,
        criteria.is_required,
        criteria.display_order
      ]);
      
      console.log(`  ✅ ${criteria.name_ar} (${criteria.category})`);
    }

    console.log('\n✅ تم إضافة جميع معايير التقييم بنجاح!');
    
    // عرض إحصائيات
    const stats = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM evaluation_criteria 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('\n📈 الإحصائيات:');
    stats.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} معيار`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة معايير التقييم:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// تشغيل السكريبت
seedEvaluationCriteria()
  .then(() => {
    console.log('\n✨ اكتملت العملية بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشلت العملية:', error);
    process.exit(1);
  });
