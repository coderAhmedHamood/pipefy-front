const { pool } = require('./config/database');

async function createAssignmentTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 بدء إنشاء جداول إسناد التذاكر والمراجعة والتقييم...\n');

    // ===== 1. جدول إسناد التذاكر (Ticket Assignments) =====
    console.log('📋 إنشاء جدول ticket_assignments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        role VARCHAR(100),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(ticket_id, user_id)
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket ON ticket_assignments(ticket_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_assignments_user ON ticket_assignments(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_assignments_active ON ticket_assignments(is_active)`);
    console.log('✅ تم إنشاء جدول ticket_assignments\n');

    // ===== 2. جدول المراجعين (Ticket Reviewers) =====
    console.log('👥 إنشاء جدول ticket_reviewers...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_reviewers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        added_by UUID REFERENCES users(id) ON DELETE SET NULL,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        review_status VARCHAR(50) DEFAULT 'pending',
        review_notes TEXT,
        reviewed_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(ticket_id, reviewer_id)
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_ticket ON ticket_reviewers(ticket_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_user ON ticket_reviewers(reviewer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_status ON ticket_reviewers(review_status)`);
    console.log('✅ تم إنشاء جدول ticket_reviewers\n');

    // ===== 3. جدول معايير التقييم (Evaluation Criteria) =====
    console.log('📊 إنشاء جدول evaluation_criteria...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluation_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        name_ar VARCHAR(200),
        description TEXT,
        category VARCHAR(100),
        options JSONB NOT NULL,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(name, category)
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_category ON evaluation_criteria(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_active ON evaluation_criteria(is_active)`);
    console.log('✅ تم إنشاء جدول evaluation_criteria\n');

    // ===== 4. جدول التقييمات (Ticket Evaluations) =====
    console.log('⭐ إنشاء جدول ticket_evaluations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
        rating VARCHAR(100) NOT NULL,
        score DECIMAL(5,2),
        notes TEXT,
        evaluated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(ticket_id, reviewer_id, criteria_id)
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_ticket ON ticket_evaluations(ticket_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_reviewer ON ticket_evaluations(reviewer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_criteria ON ticket_evaluations(criteria_id)`);
    console.log('✅ تم إنشاء جدول ticket_evaluations\n');

    // ===== 5. جدول ملخص التقييمات (Evaluation Summary) =====
    console.log('📈 إنشاء جدول ticket_evaluation_summary...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_evaluation_summary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
        total_reviewers INTEGER DEFAULT 0,
        completed_reviews INTEGER DEFAULT 0,
        average_score DECIMAL(5,2),
        overall_rating VARCHAR(50),
        evaluation_data JSONB,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_ticket ON ticket_evaluation_summary(ticket_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_rating ON ticket_evaluation_summary(overall_rating)`);
    console.log('✅ تم إنشاء جدول ticket_evaluation_summary\n');

    console.log('✅ تم إنشاء جميع الجداول بنجاح!');
    console.log('\n📋 الجداول المُنشأة:');
    console.log('  1. ticket_assignments - إسناد التذاكر للمستخدمين');
    console.log('  2. ticket_reviewers - مراجعي التذاكر');
    console.log('  3. evaluation_criteria - معايير التقييم');
    console.log('  4. ticket_evaluations - التقييمات الفردية');
    console.log('  5. ticket_evaluation_summary - ملخص التقييمات');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// تشغيل السكريبت
createAssignmentTables()
  .then(() => {
    console.log('\n✨ اكتملت العملية بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشلت العملية:', error);
    process.exit(1);
  });
