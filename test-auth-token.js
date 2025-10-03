/**
 * اختبار التوكن المحفوظ في localStorage
 */

// محاكاة localStorage (في Node.js)
const localStorage = {
  getItem: (key) => {
    // هذه القيم يجب أن تكون من المتصفح الحقيقي
    const tokens = {
      'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM',
      'auth_token': null // سيتم تحديثه
    };
    return tokens[key];
  }
};

const API_BASE_URL = 'http://localhost:3000';

async function testTokens() {
  console.log('🔑 اختبار التوكنات المختلفة...\n');
  
  const tokens = {
    'token (القديم)': localStorage.getItem('token'),
    'auth_token (الجديد)': localStorage.getItem('auth_token')
  };
  
  for (const [name, token] of Object.entries(tokens)) {
    console.log(`📋 اختبار ${name}:`);
    
    if (!token) {
      console.log('   ❌ التوكن غير موجود\n');
      continue;
    }
    
    console.log(`   🔗 التوكن: ${token.substring(0, 50)}...`);
    
    try {
      // اختبار التوكن مع endpoint المستخدمين
      const response = await fetch(`${API_BASE_URL}/api/user-processes/report/users-with-processes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`   📡 الحالة: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ نجح! عدد المستخدمين: ${data.data?.length || 0}`);
        console.log(`   📊 الإحصائيات: ${JSON.stringify(data.stats)}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ فشل: ${errorText.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`   💥 خطأ: ${error.message}`);
    }
    
    console.log('');
  }
  
  // اختبار مع التوكن الذي استخدمته في curl
  console.log('🧪 اختبار التوكن من curl:');
  const curlToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/user-processes/report/users-with-processes`, {
      headers: {
        'Authorization': `Bearer ${curlToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`   📡 الحالة: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ نجح! عدد المستخدمين: ${data.data?.length || 0}`);
      
      // عرض أول مستخدم كمثال
      if (data.data && data.data.length > 0) {
        const firstUser = data.data[0];
        console.log(`   👤 مثال - المستخدم الأول:`);
        console.log(`      الاسم: ${firstUser.user.name}`);
        console.log(`      البريد: ${firstUser.user.email}`);
        console.log(`      العمليات: ${firstUser.processes.length}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ فشل: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`   💥 خطأ: ${error.message}`);
  }
}

// تشغيل الاختبار
testTokens().then(() => {
  console.log('\n🏁 انتهى اختبار التوكنات');
  console.log('\n💡 ملاحظة: في المتصفح، تحقق من:');
  console.log('   • localStorage.getItem("auth_token")');
  console.log('   • localStorage.getItem("token")');
  console.log('   • وتأكد من استخدام التوكن الصحيح');
});
