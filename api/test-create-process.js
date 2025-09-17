const http = require('http');

// اختبار إنشاء عملية بالطريقة الصحيحة
async function testCreateProcess() {
  console.log('🧪 اختبار إنشاء العملية...\n');

  // أولاً: تسجيل الدخول للحصول على التوكن
  console.log('1️⃣ تسجيل الدخول...');
  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginResult = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  if (loginResult.statusCode !== 200) {
    console.log('❌ فشل تسجيل الدخول:', loginResult.data);
    return;
  }

  const token = loginResult.data.data.token;
  console.log('✅ تم تسجيل الدخول بنجاح\n');

  // ثانياً: اختبار إنشاء عملية بالطريقة الخاطئة (مع stages فارغة)
  console.log('2️⃣ اختبار الطريقة الخاطئة (stages فارغة)...');
  const wrongProcessData = JSON.stringify({
    name: "عملية اختبار خاطئة",
    description: "اختبار مع stages فارغة",
    color: "#FF0000",
    icon: "AlertTriangle",
    create_default_stages: false,
    stages: [{}], // هذا سيسبب خطأ
    fields: [{}],
    transitions: [{}]
  });

  const wrongResult = await makeRequest('POST', '/api/processes', wrongProcessData, token);
  console.log('النتيجة:', wrongResult.statusCode, wrongResult.data.message || wrongResult.data);
  console.log('');

  // ثالثاً: اختبار إنشاء عملية بالطريقة الصحيحة (مراحل افتراضية)
  console.log('3️⃣ اختبار الطريقة الصحيحة (مراحل افتراضية)...');
  const correctProcessData = JSON.stringify({
    name: "عملية طلبات الإجازة",
    description: "نظام إدارة طلبات الإجازة للموظفين",
    color: "#10B981",
    icon: "Calendar",
    settings: {
      auto_assign: true,
      notifications: true
    },
    create_default_stages: true
    // لا نرسل stages أو fields أو transitions
  });

  const correctResult = await makeRequest('POST', '/api/processes', correctProcessData, token);
  console.log('النتيجة:', correctResult.statusCode);
  if (correctResult.statusCode === 201) {
    console.log('✅ تم إنشاء العملية بنجاح!');
    console.log('📋 اسم العملية:', correctResult.data.data.name);
    console.log('🎨 اللون:', correctResult.data.data.color);
    console.log('📊 عدد المراحل:', correctResult.data.data.stages?.length || 'غير محدد');
  } else {
    console.log('❌ فشل إنشاء العملية:', correctResult.data.message);
  }
  console.log('');

  // رابعاً: اختبار إنشاء عملية مخصصة بالطريقة الصحيحة
  console.log('4️⃣ اختبار إنشاء عملية مخصصة...');
  const customProcessData = JSON.stringify({
    name: "عملية مراجعة المستندات",
    description: "نظام مراجعة واعتماد المستندات",
    color: "#8B5CF6",
    icon: "FileText",
    create_default_stages: false,
    stages: [
      {
        name: "مستند جديد",
        description: "مستند تم رفعه حديثاً",
        color: "#3B82F6",
        order: 1
      },
      {
        name: "قيد المراجعة",
        description: "المستند قيد المراجعة من المختص",
        color: "#F59E0B",
        order: 2
      },
      {
        name: "معتمد",
        description: "تم اعتماد المستند",
        color: "#10B981",
        order: 3
      }
    ],
    fields: [
      {
        name: "نوع المستند",
        type: "select",
        required: true,
        options: ["عقد", "فاتورة", "تقرير"]
      },
      {
        name: "ملاحظات المراجع",
        type: "textarea",
        required: false
      }
    ]
  });

  const customResult = await makeRequest('POST', '/api/processes', customProcessData, token);
  console.log('النتيجة:', customResult.statusCode);
  if (customResult.statusCode === 201) {
    console.log('✅ تم إنشاء العملية المخصصة بنجاح!');
    console.log('📋 اسم العملية:', customResult.data.data.name);
    console.log('📊 عدد المراحل:', customResult.data.data.stages?.length || 'غير محدد');
  } else {
    console.log('❌ فشل إنشاء العملية المخصصة:', customResult.data.message);
  }

  console.log('\n🎉 انتهى الاختبار!');
  console.log('🌐 يمكنك الآن فتح Swagger UI: http://localhost:3000/api-docs');
  console.log('📋 وتجربة إنشاء العمليات بنفسك');
}

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

testCreateProcess().catch(console.error);
