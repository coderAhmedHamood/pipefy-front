const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;
const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

async function debugStages() {
  try {
    console.log('🔍 فحص المراحل في العملية...\n');

    // تسجيل الدخول
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // جلب العملية مع المراحل
    const processResponse = await axios.get(`${API_URL}/processes/${PROCESS_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const process = processResponse.data.data;
    console.log(`📋 العملية: ${process.name}\n`);

    if (process.stages && process.stages.length > 0) {
      console.log('🎯 المراحل:');
      process.stages.forEach((stage, index) => {
        console.log(`${index + 1}. ${stage.name}`);
        console.log(`   المعرف: ${stage.id}`);
        console.log(`   is_final: ${stage.is_final}`);
        console.log(`   is_initial: ${stage.is_initial}`);
        console.log(`   اللون: ${stage.color}`);
        console.log('');
      });

      const finalStages = process.stages.filter(s => s.is_final === true);
      const nonFinalStages = process.stages.filter(s => s.is_final === false);
      
      console.log(`📊 الإحصائيات:`);
      console.log(`- المراحل النهائية (is_final = true): ${finalStages.length}`);
      console.log(`- المراحل غير النهائية (is_final = false): ${nonFinalStages.length}`);
      
      if (finalStages.length > 0) {
        console.log(`\n🏁 المراحل النهائية:`);
        finalStages.forEach(stage => console.log(`- ${stage.name}`));
      }
      
      if (nonFinalStages.length > 0) {
        console.log(`\n🔄 المراحل غير النهائية:`);
        nonFinalStages.forEach(stage => console.log(`- ${stage.name}`));
      }
    } else {
      console.log('❌ لا توجد مراحل في هذه العملية');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

debugStages();
