const { pool } = require('./config/database');

const USER_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

async function checkUserTickets() {
  try {
    console.log('🔍 فحص تذاكر المستخدم...\n');
    console.log(`User ID: ${USER_ID}\n`);

    // 1. التحقق من وجود المستخدم
    const userCheck = await pool.query(`
      SELECT id, name, email FROM users WHERE id = $1
    `, [USER_ID]);

    if (userCheck.rows.length === 0) {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات!');
      process.exit(1);
    }

    console.log('✅ المستخدم موجود:');
    console.log(`   - الاسم: ${userCheck.rows[0].name}`);
    console.log(`   - البريد: ${userCheck.rows[0].email}\n`);

    // 2. التذاكر في حقل assigned_to (الإسناد الأساسي)
    const assignedToTickets = await pool.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        t.status,
        t.priority,
        p.name as process_name,
        s.name as stage_name
      FROM tickets t
      LEFT JOIN processes p ON t.process_id = p.id
      LEFT JOIN stages s ON t.current_stage_id = s.id
      WHERE t.assigned_to = $1
        AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [USER_ID]);

    console.log(`📋 التذاكر في حقل assigned_to: ${assignedToTickets.rows.length}`);
    if (assignedToTickets.rows.length > 0) {
      assignedToTickets.rows.forEach((ticket, i) => {
        console.log(`   ${i + 1}. ${ticket.ticket_number}`);
        console.log(`      ${ticket.title.substring(0, 50)}${ticket.title.length > 50 ? '...' : ''}`);
        console.log(`      العملية: ${ticket.process_name} | المرحلة: ${ticket.stage_name}`);
      });
    } else {
      console.log('   ❌ لا توجد تذاكر');
    }
    console.log('');

    // 3. التذاكر في جدول ticket_assignments (الإسنادات الإضافية)
    const assignmentTickets = await pool.query(`
      SELECT 
        ta.id as assignment_id,
        ta.role,
        ta.is_active,
        ta.assigned_at,
        t.id as ticket_id,
        t.ticket_number,
        t.title,
        t.status,
        p.name as process_name
      FROM ticket_assignments ta
      LEFT JOIN tickets t ON ta.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE ta.user_id = $1
      ORDER BY ta.assigned_at DESC
      LIMIT 10
    `, [USER_ID]);

    console.log(`📋 التذاكر في جدول ticket_assignments: ${assignmentTickets.rows.length}`);
    if (assignmentTickets.rows.length > 0) {
      assignmentTickets.rows.forEach((assignment, i) => {
        console.log(`   ${i + 1}. ${assignment.ticket_number}`);
        console.log(`      ${assignment.title?.substring(0, 50) || 'N/A'}${assignment.title?.length > 50 ? '...' : ''}`);
        console.log(`      الدور: ${assignment.role || 'N/A'} | نشط: ${assignment.is_active ? 'نعم' : 'لا'}`);
      });
    } else {
      console.log('   ❌ لا توجد إسنادات إضافية');
    }
    console.log('');

    // 4. إحصائيات
    const stats = await pool.query(`
      SELECT 
        COUNT(CASE WHEN assigned_to = $1 THEN 1 END) as assigned_to_count,
        COUNT(CASE WHEN created_by = $1 THEN 1 END) as created_by_count
      FROM tickets
      WHERE deleted_at IS NULL
    `, [USER_ID]);

    console.log('📊 الإحصائيات:');
    console.log(`   - التذاكر المُسندة (assigned_to): ${stats.rows[0].assigned_to_count}`);
    console.log(`   - التذاكر المُنشأة (created_by): ${stats.rows[0].created_by_count}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ تم الفحص بنجاح!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkUserTickets();
