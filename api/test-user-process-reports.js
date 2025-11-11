const axios = require('axios');
const { pool } = require('./config/database');

const BASE_URL = 'http://localhost:3004/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function createSampleData() {
  console.log('📋 إنشاء بيانات تجريبية للاختبار...');
  
  const client = await pool.connect();
  try {
    // جلب مستخدمين وعمليات موجودة
    const users = await client.query('SELECT id, name FROM users WHERE deleted_at IS NULL LIMIT 3');
    const processes = await client.query('SELECT id, name FROM processes WHERE deleted_at IS NULL LIMIT 2');
    
    if (users.rows.length === 0 || processes.rows.length === 0) {
      console.log('⚠️ لا توجد بيانات كافية لإنشاء الروابط');
      return false;
    }

    // إنشاء بعض الروابط التجريبية
    for (let i = 0; i < Math.min(users.rows.length, 3); i++) {
      for (let j = 0; j < Math.min(processes.rows.length, 2); j++) {
        const roles = ['admin', 'member', 'viewer'];
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        
        try {
          await client.query(`
            INSERT INTO user_processes (user_id, process_id, role, is_active)
            VALUES ($1, $2, $3, true)
            ON CONFLICT (user_id, process_id) DO UPDATE SET role = EXCLUDED.role
          `, [users.rows[i].id, processes.rows[j].id, randomRole]);
          
          console.log(`   ✅ ربط ${users.rows[i].name} بـ ${processes.rows[j].name} كـ ${randomRole}`);
        } catch (error) {
          // تجاهل أخطاء التكرار
        }
      }
    }
    
    return true;
  } finally {
    client.release();
  }
}

async function testReportEndpoints() {
  try {
    console.log('🚀 اختبار endpoints التقارير الجديدة\n');

    // إنشاء بيانات تجريبية
    await createSampleData();
    
    console.log('\n🧪 اختبار التقرير الشامل...');
    try {
      const response = await axios.get(`${BASE_URL}/user-processes/report/users-with-processes`, { headers });
      
      console.log(`✅ نجح: ${response.status}`);
      console.log(`📊 الإحصائيات:`, response.data.stats);
      console.log(`👥 عدد المستخدمين: ${response.data.data.length}`);
      
      // عرض أول 3 مستخدمين كمثال
      response.data.data.slice(0, 3).forEach((item, index) => {
        console.log(`\n${index + 1}. المستخدم: ${item.user.name} (${item.user.email})`);
        console.log(`   عدد العمليات: ${item.user.processes_count}`);
        if (item.processes.length > 0) {
          item.processes.forEach(process => {
            console.log(`   - ${process.process_name} (${process.user_role})`);
          });
        } else {
          console.log('   - لا توجد عمليات');
        }
      });
      
    } catch (error) {
      console.log(`❌ فشل: ${error.response?.status}`);
      console.log(`🚨 الخطأ: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🧪 اختبار التقرير المبسط...');
    try {
      const response = await axios.get(`${BASE_URL}/user-processes/report/simple`, { headers });
      
      console.log(`✅ نجح: ${response.status}`);
      console.log(`👥 عدد المستخدمين: ${response.data.data.length}`);
      
      // عرض جميع المستخدمين
      response.data.data.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.user_name} (${item.user_email})`);
        console.log(`   عدد العمليات: ${item.processes_count}`);
        console.log(`   العمليات: ${item.processes_list}`);
      });
      
    } catch (error) {
      console.log(`❌ فشل: ${error.response?.status}`);
      console.log(`🚨 الخطأ: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 انتهى اختبار التقارير!');
    
  } catch (error) {
    console.error('💥 خطأ عام:', error.message);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testReportEndpoints();
}

module.exports = { testReportEndpoints };
