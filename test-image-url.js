// اختبار رابط الصورة
const axios = require('axios');

const testImageUrl = async () => {
  const imageUrl = 'http://localhost:3003/api/uploads/logos/logo-1760982145484-628350330.png';
  
  console.log('🧪 اختبار رابط الصورة:', imageUrl);
  
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer', // للصور
      timeout: 5000
    });
    
    console.log('✅ الصورة موجودة!');
    console.log('📊 حالة الاستجابة:', response.status);
    console.log('📏 حجم الصورة:', response.data.length, 'bytes');
    console.log('🎭 نوع المحتوى:', response.headers['content-type']);
    
  } catch (error) {
    console.error('❌ خطأ في الوصول للصورة:');
    console.error('📍 حالة الخطأ:', error.response?.status);
    console.error('📍 رسالة الخطأ:', error.response?.statusText);
    console.error('📍 تفاصيل الخطأ:', error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 الملف غير موجود في هذا المسار');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 تأكد من أن الخادم يعمل على المنفذ 3003');
    }
    
    // اختبار مسارات بديلة
    console.log('\n🔍 اختبار مسارات بديلة...');
    
    const alternativeUrls = [
      'http://localhost:3003/uploads/logos/logo-1760982145484-628350330.png',
      'http://localhost:3003/static/uploads/logos/logo-1760982145484-628350330.png',
      'http://localhost:3003/public/uploads/logos/logo-1760982145484-628350330.png'
    ];
    
    for (const url of alternativeUrls) {
      try {
        console.log('🔗 جاري اختبار:', url);
        const altResponse = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: 3000 
        });
        console.log('✅ وُجد في:', url);
        break;
      } catch (altError) {
        console.log('❌ لم يُوجد في:', url);
      }
    }
  }
};

testImageUrl();
