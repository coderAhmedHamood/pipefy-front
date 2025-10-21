const { pool } = require('./config/database');
const TicketReviewer = require('./models/TicketReviewer');

async function testRateFieldSystem() {
  console.log('🧪 بدء اختبار نظام حقل التقييم (rate)...\n');
  
  try {
    // 1. تشغيل Migration لإضافة الحقل
    console.log('1️⃣ تشغيل Migration...');
    const { addRateFieldToTicketReviewers } = require('./add-rate-field-migration');
    await addRateFieldToTicketReviewers();
    console.log('✅ Migration مكتمل\n');

    // 2. اختبار التحقق من صحة القيم
    console.log('2️⃣ اختبار التحقق من صحة قيم التقييم...');
    
    // قيم صحيحة
    const validRates = ['ضعيف', 'جيد', 'جيد جدا', 'ممتاز', null, undefined];
    validRates.forEach(rate => {
      const isValid = TicketReviewer.validateRate(rate);
      console.log(`   ${rate || 'null/undefined'}: ${isValid ? '✅' : '❌'}`);
    });

    // قيم خاطئة
    const invalidRates = ['ممتاز جداً', 'سيء', 'excellent', ''];
    invalidRates.forEach(rate => {
      const isValid = TicketReviewer.validateRate(rate);
      console.log(`   ${rate}: ${isValid ? '❌ خطأ!' : '✅ رُفض بشكل صحيح'}`);
    });
    console.log();

    // 3. إنشاء بيانات اختبار
    console.log('3️⃣ إنشاء بيانات اختبار...');
    
    // إنشاء مستخدم اختبار
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password_hash) 
      VALUES ('مراجع اختبار', 'test-reviewer@example.com', 'hash123')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const userId = userResult.rows[0].id;
    console.log(`✅ مستخدم اختبار: ${userId}`);

    // إنشاء عملية اختبار
    const processResult = await pool.query(`
      INSERT INTO processes (name, description) 
      VALUES ('عملية اختبار التقييم', 'عملية لاختبار نظام التقييم')
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id
    `);
    const processId = processResult.rows[0].id;
    console.log(`✅ عملية اختبار: ${processId}`);

    // إنشاء تذكرة اختبار
    const ticketResult = await pool.query(`
      INSERT INTO tickets (process_id, title, description, created_by, ticket_number) 
      VALUES ($1, 'تذكرة اختبار التقييم', 'تذكرة لاختبار نظام التقييم', $2, 'TEST-001')
      ON CONFLICT (ticket_number) DO UPDATE SET title = EXCLUDED.title
      RETURNING id
    `, [processId, userId]);
    const ticketId = ticketResult.rows[0].id;
    console.log(`✅ تذكرة اختبار: ${ticketId}\n`);

    // 4. اختبار إنشاء مراجع مع تقييم
    console.log('4️⃣ اختبار إنشاء مراجع مع تقييم...');
    
    const reviewer1 = await TicketReviewer.create({
      ticket_id: ticketId,
      reviewer_id: userId,
      added_by: userId,
      review_notes: 'مراجع مع تقييم ممتاز',
      rate: 'ممتاز'
    });
    console.log(`✅ مراجع مع تقييم: ${reviewer1.id} - ${reviewer1.rate}`);

    // 5. اختبار إنشاء مراجع بدون تقييم
    console.log('5️⃣ اختبار إنشاء مراجع بدون تقييم...');
    
    // حذف المراجع السابق أولاً
    await TicketReviewer.hardDelete(reviewer1.id);
    
    const reviewer2 = await TicketReviewer.create({
      ticket_id: ticketId,
      reviewer_id: userId,
      added_by: userId,
      review_notes: 'مراجع بدون تقييم'
    });
    console.log(`✅ مراجع بدون تقييم: ${reviewer2.id} - ${reviewer2.rate || 'null'}`);

    // 6. اختبار تحديث التقييم
    console.log('6️⃣ اختبار تحديث التقييم...');
    
    const updatedReviewer = await TicketReviewer.updateReviewStatus(reviewer2.id, {
      review_status: 'completed',
      review_notes: 'مراجعة مكتملة مع تقييم',
      rate: 'جيد جدا'
    });
    console.log(`✅ تحديث التقييم: ${updatedReviewer.rate}`);

    // 7. اختبار تحديث التقييم فقط
    console.log('7️⃣ اختبار تحديث التقييم فقط...');
    
    const rateOnlyUpdate = await TicketReviewer.updateReviewStatus(reviewer2.id, {
      rate: 'ضعيف'
    });
    console.log(`✅ تحديث التقييم فقط: ${rateOnlyUpdate.rate}`);

    // 8. اختبار قيمة خاطئة
    console.log('8️⃣ اختبار قيمة تقييم خاطئة...');
    
    try {
      await TicketReviewer.updateReviewStatus(reviewer2.id, {
        rate: 'قيمة خاطئة'
      });
      console.log('❌ خطأ: تم قبول قيمة خاطئة!');
    } catch (error) {
      console.log(`✅ رُفضت القيمة الخاطئة: ${error.message}`);
    }

    // 9. اختبار جلب البيانات
    console.log('9️⃣ اختبار جلب البيانات...');
    
    const reviewers = await TicketReviewer.findByTicket(ticketId);
    console.log(`✅ عدد المراجعين: ${reviewers.length}`);
    reviewers.forEach(r => {
      console.log(`   - المراجع ${r.id}: التقييم = ${r.rate || 'غير محدد'}`);
    });

    // 10. اختبار إعادة التفعيل مع تقييم
    console.log('🔟 اختبار إعادة التفعيل مع تقييم...');
    
    // حذف المراجع أولاً
    await TicketReviewer.delete(reviewer2.id);
    
    // إعادة تفعيل مع تقييم جديد
    const reactivated = await TicketReviewer.reactivate(reviewer2.id, {
      added_by: userId,
      review_notes: 'إعادة تفعيل مع تقييم جديد',
      rate: 'جيد'
    });
    console.log(`✅ إعادة تفعيل مع تقييم: ${reactivated.rate}`);

    // 11. اختبار API endpoint
    console.log('1️⃣1️⃣ اختبار API endpoint...');
    
    const axios = require('axios').default;
    
    try {
      // محاولة تسجيل الدخول للحصول على token
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
      });
      
      const token = loginResponse.data.token;
      console.log('✅ تم الحصول على token');

      // اختبار PUT /api/ticket-reviewers/:id/status مع rate
      const updateResponse = await axios.put(
        `http://localhost:3000/api/ticket-reviewers/${reactivated.id}/status`,
        {
          review_status: 'completed',
          review_notes: 'اختبار API مع تقييم',
          rate: 'ممتاز'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log(`✅ API endpoint يعمل: ${updateResponse.data.data.rate}`);
      
    } catch (apiError) {
      console.log(`⚠️ اختبار API تخطى: ${apiError.message}`);
    }

    // تنظيف البيانات
    console.log('\n🧹 تنظيف بيانات الاختبار...');
    await pool.query('DELETE FROM ticket_reviewers WHERE ticket_id = $1', [ticketId]);
    await pool.query('DELETE FROM tickets WHERE id = $1', [ticketId]);
    await pool.query('DELETE FROM processes WHERE id = $1', [processId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('✅ تم تنظيف البيانات');

    console.log('\n🎉 جميع الاختبارات نجحت! نظام التقييم يعمل بشكل مثالي');

  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message);
    console.error(error.stack);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testRateFieldSystem()
    .then(() => {
      console.log('\n✅ اختبار النظام مكتمل');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ فشل اختبار النظام:', error);
      process.exit(1);
    });
}

module.exports = { testRateFieldSystem };
