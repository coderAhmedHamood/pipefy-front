import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Settings, 
  Users, 
  FolderOpen, 
  Zap,
  Play,
  BookOpen,
  Target
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  optional?: boolean;
}

export const SetupGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'welcome',
      title: 'مرحباً بك في نظام إدارة العمليات',
      description: 'سنقوم بإعداد النظام خطوة بخطوة لتبدأ العمل بكفاءة',
      icon: Target,
      completed: true
    },
    {
      id: 'company-info',
      title: 'معلومات الشركة',
      description: 'إعداد اسم الشركة والشعار والألوان',
      icon: Settings,
      completed: false
    },
    {
      id: 'users',
      title: 'إضافة المستخدمين',
      description: 'إنشاء حسابات للموظفين وتحديد الأدوار',
      icon: Users,
      completed: false
    },
    {
      id: 'processes',
      title: 'إنشاء العمليات',
      description: 'تصميم العمليات الأساسية (المشتريات، التوظيف، الشكاوى)',
      icon: FolderOpen,
      completed: false
    },
    {
      id: 'automation',
      title: 'إعداد الأتمتة',
      description: 'تكوين القواعد التلقائية والإشعارات',
      icon: Zap,
      completed: false,
      optional: true
    },
    {
      id: 'ready',
      title: 'النظام جاهز!',
      description: 'تم إعداد النظام بنجاح ويمكنك البدء في العمل',
      icon: CheckCircle,
      completed: false
    }
  ]);

  const completeStep = (stepId: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">دليل إعداد النظام</h1>
            <p className="text-gray-600">إعداد النظام خطوة بخطوة للبدء في العمل</p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">الخطوة {currentStep + 1} من {steps.length}</div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar - Steps List */}
        <div className="w-1/3 bg-white border-l border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">خطوات الإعداد</h3>
          
          <div className="space-y-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`
                    w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors text-right
                    ${currentStep === index 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <StepIcon className={`w-5 h-5 ${
                      currentStep === index ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${
                      currentStep === index ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </div>
                    {step.optional && (
                      <span className="text-xs text-gray-500">(اختياري)</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Current Step */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>

              {/* Step Content */}
              <div className="space-y-6">
                {currentStepData.id === 'welcome' && (
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                      <h3 className="text-xl font-bold mb-2">مرحباً بك!</h3>
                      <p>سنقوم بإعداد نظام إدارة العمليات المتطور خطوة بخطوة</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">ما ستحصل عليه:</h4>
                        <ul className="text-gray-600 space-y-1 text-right">
                          <li>• نظام كانبان تفاعلي</li>
                          <li>• إدارة العمليات والمراحل</li>
                          <li>• نظام المستخدمين والصلاحيات</li>
                          <li>• التقارير والتحليلات</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">المدة المتوقعة:</h4>
                        <ul className="text-gray-600 space-y-1 text-right">
                          <li>• الإعداد الأساسي: 10 دقائق</li>
                          <li>• الإعداد المتقدم: 30 دقيقة</li>
                          <li>• يمكن التخطي والعودة لاحقاً</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {currentStepData.id === 'company-info' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="أدخل اسم شركتك"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">شعار الشركة</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="text-gray-400 mb-2">اسحب الشعار هنا أو</div>
                        <button className="text-blue-600 hover:text-blue-700">اختر ملف</button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اللون الأساسي</label>
                      <div className="flex space-x-2 space-x-reverse">
                        {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 ${color} rounded-lg border-2 border-transparent hover:border-gray-400`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStepData.id === 'users' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">إضافة المستخدمين</h4>
                      <p className="text-blue-700 text-sm">أضف أعضاء الفريق وحدد أدوارهم في النظام</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex space-x-3 space-x-reverse">
                        <input
                          type="text"
                          placeholder="الاسم"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="email"
                          placeholder="البريد الإلكتروني"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option>مدير</option>
                          <option>عضو</option>
                          <option>ضيف</option>
                        </select>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentStepData.id === 'processes' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">العمليات الأساسية</h4>
                      <p className="text-green-700 text-sm">سننشئ العمليات الأساسية التي تحتاجها معظم الشركات</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'المشتريات', color: 'bg-blue-500', desc: 'إدارة طلبات الشراء والموافقات' },
                        { name: 'التوظيف', color: 'bg-purple-500', desc: 'عملية التوظيف من الإعلان للتعيين' },
                        { name: 'الشكاوى', color: 'bg-red-500', desc: 'معالجة شكاوى العملاء والموظفين' },
                        { name: 'المشاريع', color: 'bg-green-500', desc: 'إدارة المشاريع والمهام' }
                      ].map((process) => (
                        <div key={process.name} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <div className={`w-4 h-4 ${process.color} rounded`}></div>
                            <h5 className="font-medium text-gray-900">{process.name}</h5>
                          </div>
                          <p className="text-sm text-gray-600">{process.desc}</p>
                          <label className="flex items-center mt-2">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                            <span className="mr-2 text-sm text-gray-700">إنشاء هذه العملية</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStepData.id === 'automation' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">الأتمتة والإشعارات</h4>
                      <p className="text-yellow-700 text-sm">إعداد القواعد التلقائية لتحسين سير العمل (يمكن تخطي هذه الخطوة)</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        'إرسال إشعار عند إنشاء تذكرة جديدة',
                        'تنبيه قبل انتهاء الموعد النهائي بيوم',
                        'نقل التذكرة تلقائياً عند اكتمال المتطلبات',
                        'إرسال تقرير أسبوعي للمديرين'
                      ].map((rule, index) => (
                        <label key={index} className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                          <span className="mr-3 text-sm text-gray-700">{rule}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {currentStepData.id === 'ready' && (
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">تهانينا! النظام جاهز</h3>
                    <p className="text-gray-600 mb-6">تم إعداد النظام بنجاح ويمكنك الآن البدء في العمل</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-900">دليل المستخدم</div>
                        <div className="text-sm text-gray-500">تعلم كيفية استخدام النظام</div>
                      </button>
                      
                      <button className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                        <Play className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-900">ابدأ العمل</div>
                        <div className="text-sm text-gray-500">انتقل إلى لوحة كانبان</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>السابق</span>
              </button>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                {currentStepData.id !== 'ready' && (
                  <button
                    onClick={() => completeStep(currentStepData.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    تم الإنجاز
                  </button>
                )}
                
                <button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{currentStep === steps.length - 1 ? 'إنهاء' : 'التالي'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};