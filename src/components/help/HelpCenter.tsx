import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight,
  ChevronDown,
  Settings,
  Users,
  FolderOpen,
  BarChart3,
  Zap,
  Bell,
  Shield,
  Database,
  Globe,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Copy,
  ExternalLink,
  Lightbulb,
  Target,
  Layers,
  FileText,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Edit,
  Plus,
  Trash2,
  Filter,
  Download,
  Upload,
  Mail,
  MessageSquare,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  subsections: HelpSubsection[];
}

interface HelpSubsection {
  id: string;
  title: string;
  content: string;
  steps?: HelpStep[];
  tips?: string[];
  images?: string[];
}

interface HelpStep {
  title: string;
  description: string;
  benefit: string;
  code?: string;
  image?: string;
}

export const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const [selectedSubsection, setSelectedSubsection] = useState('introduction');
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started']);

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'البدء السريع',
      icon: Lightbulb,
      color: 'text-green-600',
      subsections: [
        {
          id: 'introduction',
          title: 'مقدمة عن النظام',
          content: 'نظام إدارة العمليات والتذاكر المتطور هو حل شامل لإدارة سير العمل والمهام في المؤسسات. يوفر النظام واجهة كانبان تفاعلية مع إمكانيات متقدمة لتخصيص العمليات والمراحل.',
          steps: [
            {
              title: 'ما هو نظام إدارة العمليات؟',
              description: 'نظام متكامل يساعد المؤسسات على تنظيم وإدارة العمليات المختلفة مثل المشتريات، التوظيف، الشكاوى، والمشاريع من خلال واجهة كانبان سهلة الاستخدام.',
              benefit: 'فهم طبيعة النظام يساعدك على تحديد كيفية استخدامه بأفضل طريقة ممكنة لتحسين إنتاجية فريقك وتنظيم العمل بشكل أكثر فعالية.'
            },
            {
              title: 'الميزات الرئيسية',
              description: 'لوحة كانبان تفاعلية، إدارة المستخدمين والصلاحيات، تقارير وإحصائيات، أتمتة المهام، إشعارات ذكية، تكامل مع الأنظمة الخارجية.',
              benefit: 'معرفة الميزات المتاحة تمكنك من الاستفادة الكاملة من النظام وتخطيط استراتيجية التنفيذ بناءً على احتياجات مؤسستك.'
            },
            {
              title: 'من يمكنه الاستفادة؟',
              description: 'الشركات الصغيرة والمتوسطة، الإدارات الحكومية، المؤسسات التعليمية، والفرق التقنية التي تحتاج لتنظيم سير العمل.',
              benefit: 'تحديد ما إذا كان النظام مناسب لمؤسستك يوفر عليك الوقت والجهد ويضمن اتخاذ القرار الصحيح قبل البدء في التنفيذ.'
            }
          ]
        },
        {
          id: 'first-login',
          title: 'تسجيل الدخول الأول',
          content: 'خطوات تسجيل الدخول الأول وإعداد الحساب الشخصي.',
          steps: [
            {
              title: 'الوصول للنظام',
              description: 'افتح المتصفح وانتقل إلى رابط النظام الذي تم توفيره من قبل مدير النظام.',
              benefit: 'الوصول الصحيح للنظام يضمن الأمان ويتيح لك الاستفادة من جميع الميزات المتاحة دون مشاكل تقنية.'
            },
            {
              title: 'إدخال بيانات الدخول',
              description: 'أدخل البريد الإلكتروني وكلمة المرور التي تم توفيرها لك. للتجربة استخدم: admin@pipefy.com / admin123',
              benefit: 'تسجيل الدخول الصحيح يمنحك الوصول للميزات المخصصة لدورك ويحمي بيانات المؤسسة من الوصول غير المصرح به.'
            },
            {
              title: 'تخصيص الملف الشخصي',
              description: 'بعد الدخول، يمكنك تحديث معلوماتك الشخصية من قسم الإعدادات.',
              benefit: 'تحديث الملف الشخصي يساعد زملاءك على التعرف عليك ويضمن وصول الإشعارات المهمة إليك بشكل صحيح.'
            }
          ],
          tips: [
            'احفظ كلمة المرور في مكان آمن',
            'غير كلمة المرور الافتراضية فور الدخول',
            'تأكد من صحة بريدك الإلكتروني لاستقبال الإشعارات'
          ]
        },
        {
          id: 'interface-overview',
          title: 'نظرة عامة على الواجهة',
          content: 'تعرف على العناصر الأساسية في واجهة النظام وكيفية التنقل بينها.',
          steps: [
            {
              title: 'الشريط الجانبي',
              description: 'يحتوي على جميع أقسام النظام: لوحة المعلومات، كانبان، العمليات، المستخدمين، التقارير، والإعدادات.',
              benefit: 'فهم الشريط الجانبي يمكنك من التنقل السريع بين أقسام النظام وزيادة كفاءة العمل دون ضياع الوقت في البحث.'
            },
            {
              title: 'المنطقة الرئيسية',
              description: 'تعرض محتوى القسم المحدد. في لوحة كانبان ترى العمليات والتذاكر مرتبة حسب المراحل.',
              benefit: 'المنطقة الرئيسية هي مساحة العمل الأساسية حيث ستقضي معظم وقتك، فهمها يحسن من سرعة إنجاز المهام.'
            },
            {
              title: 'شريط البحث والفلاتر',
              description: 'يمكنك البحث في التذاكر وتطبيق فلاتر مختلفة لتسهيل العثور على ما تحتاجه.',
              benefit: 'استخدام البحث والفلاتر يوفر الوقت بشكل كبير خاصة عند التعامل مع عدد كبير من التذاكر ويحسن من دقة المتابعة.'
            }
          ]
        }
      ]
    },
    {
      id: 'system-setup',
      title: 'إعداد النظام',
      icon: Settings,
      color: 'text-blue-600',
      subsections: [
        {
          id: 'initial-configuration',
          title: 'الإعداد الأولي',
          content: 'خطوات إعداد النظام من البداية لتكون جاهزاً للاستخدام.',
          steps: [
            {
              title: '1. إعداد معلومات الشركة',
              description: 'انتقل إلى الإعدادات > عام وأدخل اسم شركتك، الشعار، والألوان المفضلة. هذا يعطي النظام هوية بصرية مميزة.',
              benefit: 'تخصيص هوية الشركة يعزز الانتماء لدى الموظفين ويعطي انطباعاً احترافياً للعملاء والزوار، كما يسهل التعرف على النظام.'
            },
            {
              title: '2. تكوين المنطقة الزمنية',
              description: 'حدد المنطقة الزمنية المناسبة وتنسيق التاريخ وساعات العمل. هذا مهم لدقة التوقيتات والمواعيد النهائية.',
              benefit: 'ضبط التوقيت الصحيح يضمن دقة المواعيد النهائية والإشعارات، ويمنع سوء الفهم في التوقيتات بين أعضاء الفريق.'
            },
            {
              title: '3. إعداد الإشعارات',
              description: 'فعّل الإشعارات المطلوبة (بريد إلكتروني، داخل التطبيق) وحدد أنواع الأحداث التي تريد تلقي إشعارات عنها.',
              benefit: 'الإشعارات المناسبة تضمن عدم فوات أي مهمة مهمة وتحسن من التواصل بين أعضاء الفريق دون إزعاج غير ضروري.'
            }
          ]
        },
        {
          id: 'user-management',
          title: 'إدارة المستخدمين',
          content: 'كيفية إضافة المستخدمين وتحديد الأدوار والصلاحيات.',
          steps: [
            {
              title: '1. إنشاء الأدوار',
              description: 'انتقل إلى المستخدمين > الأدوار وأنشئ أدوار مخصصة مثل "مدير المشتريات" أو "موظف الموارد البشرية" مع تحديد الصلاحيات المناسبة.',
              benefit: 'تحديد الأدوار بوضوح يضمن أن كل شخص يعرف مسؤولياته ويحمي النظام من الوصول غير المصرح به للبيانات الحساسة.'
            },
            {
              title: '2. إضافة المستخدمين',
              description: 'في قسم المستخدمين، اضغط "مستخدم جديد" وأدخل الاسم، البريد الإلكتروني، وحدد الدور المناسب.',
              benefit: 'إضافة المستخدمين بالطريقة الصحيحة يضمن حصول كل شخص على الصلاحيات المناسبة لعمله ويسهل المتابعة والمساءلة.'
            },
            {
              title: '3. تخصيص الصلاحيات',
              description: 'يمكنك تخصيص صلاحيات إضافية لمستخدمين محددين من خلال تعديل ملفهم الشخصي.',
              benefit: 'المرونة في الصلاحيات تتيح التكيف مع الاحتياجات الخاصة دون الحاجة لإنشاء أدوار جديدة لكل حالة استثنائية.'
            }
          ],
          tips: [
            'ابدأ بإنشاء الأدوار الأساسية: مدير، موظف، ضيف',
            'تأكد من منح صلاحيات مناسبة لكل دور',
            'استخدم أسماء واضحة للأدوار تعكس المسؤوليات'
          ]
        },
        {
          id: 'process-creation',
          title: 'إنشاء العمليات',
          content: 'دليل شامل لإنشاء وتخصيص العمليات والمراحل.',
          steps: [
            {
              title: '1. إنشاء عملية جديدة',
              description: 'انتقل إلى العمليات واضغط "عملية جديدة". أدخل اسم العملية (مثل: المشتريات) ووصف مختصر واختر لون مميز.',
              benefit: 'إنشاء عمليات منظمة يساعد على تقسيم العمل بوضوح ويسهل على الموظفين فهم مسار كل نوع من المهام.'
            },
            {
              title: '2. تصميم المراحل',
              description: 'أضف المراحل المطلوبة مثل: "طلب جديد" → "مراجعة" → "موافقة" → "تنفيذ" → "مكتمل". اختر ألوان مناسبة لكل مرحلة.',
              benefit: 'تصميم مراحل واضحة يحسن من تتبع التقدم ويقلل من الأخطاء ويضمن عدم تفويت أي خطوة مهمة في العملية.'
            },
            {
              title: '3. إضافة الحقول المخصصة',
              description: 'أضف الحقول المطلوبة لجمع البيانات مثل: المبلغ (رقم)، المورد (نص)، القسم (قائمة منسدلة)، مراجع التذكرة (مراجع).',
              benefit: 'الحقول المخصصة تضمن جمع جميع البيانات المطلوبة لاتخاذ القرارات وتسهل عملية التحليل والتقارير لاحقاً.'
            },
            {
              title: '4. تكوين قواعد الانتقال',
              description: 'حدد كيفية انتقال التذاكر بين المراحل والشروط المطلوبة لكل انتقال.',
              benefit: 'قواعد الانتقال تضمن سير العمل بطريقة منطقية وتمنع تخطي خطوات مهمة، مما يحسن من جودة النتائج النهائية.'
            }
          ]
        }
      ]
    },
    {
      id: 'daily-usage',
      title: 'الاستخدام اليومي',
      icon: Target,
      color: 'text-purple-600',
      subsections: [
        {
          id: 'creating-tickets',
          title: 'إنشاء التذاكر',
          content: 'كيفية إنشاء تذاكر جديدة وملء البيانات المطلوبة.',
          steps: [
            {
              title: '1. اختيار العملية',
              description: 'من لوحة كانبان، اختر العملية المناسبة من القائمة المنسدلة في الأعلى.',
              benefit: 'اختيار العملية الصحيحة يضمن ظهور الحقول والمراحل المناسبة، ويوجه التذكرة للأشخاص المختصين في هذا المجال.'
            },
            {
              title: '2. إنشاء التذكرة',
              description: 'اضغط "تذكرة جديدة" أو "إضافة تذكرة" في العمود المطلوب. ستفتح نافذة تحتوي على الحقول المخصصة للعملية.',
              benefit: 'إنشاء التذكرة في المكان الصحيح يوفر الوقت ويضمن وصولها للمرحلة المناسبة من البداية.'
            },
            {
              title: '3. ملء البيانات',
              description: 'أدخل العنوان والوصف، ثم املأ الحقول المخصصة مثل المبلغ، المورد، القسم، واختر المراجع المناسب.',
              benefit: 'ملء البيانات بدقة يسهل على المراجعين اتخاذ القرارات السريعة ويقلل من الحاجة للاستفسارات الإضافية.'
            },
            {
              title: '4. تحديد التفاصيل',
              description: 'حدد الأولوية، تاريخ الاستحقاق، والمكلف إذا كان مطلوباً.',
              benefit: 'تحديد الأولوية والمواعيد يساعد في ترتيب المهام حسب الأهمية ويضمن إنجاز المهام العاجلة في الوقت المناسب.'
            }
          ]
        },
        {
          id: 'managing-tickets',
          title: 'إدارة التذاكر',
          content: 'كيفية تحديث ونقل التذاكر بين المراحل المختلفة.',
          steps: [
            {
              title: '1. عرض تفاصيل التذكرة',
              description: 'انقر على أي تذكرة لفتح نافذة التفاصيل التي تحتوي على جميع المعلومات والأنشطة.',
              benefit: 'عرض التفاصيل الكاملة يمكنك من فهم السياق الكامل للمهمة واتخاذ قرارات مدروسة بناءً على المعلومات المتاحة.'
            },
            {
              title: '2. تحديث البيانات',
              description: 'يمكنك تعديل أي حقل في التذكرة، إضافة تعليقات، أو رفع مرفقات جديدة.',
              benefit: 'المرونة في التحديث تتيح التكيف مع التغييرات والمستجدات، وتضمن أن المعلومات محدثة دائماً لجميع أعضاء الفريق.'
            },
            {
              title: '3. نقل التذكرة',
              description: 'اسحب التذكرة إلى عمود آخر أو استخدم أزرار "نقل إلى مرحلة" في نافذة التفاصيل.',
              benefit: 'نقل التذاكر بسهولة يحسن من تدفق العمل ويوضح التقدم المحرز، مما يساعد في متابعة الأداء وتحديد الاختناقات.'
            },
            {
              title: '4. إضافة تعليقات',
              description: 'استخدم قسم التعليقات لتوثيق التقدم والتواصل مع أعضاء الفريق.',
              benefit: 'التوثيق المستمر يحفظ تاريخ القرارات ويسهل على الأعضاء الجدد فهم السياق، كما يساعد في حل المشاكل المستقبلية.'
            }
          ]
        },
        {
          id: 'collaboration',
          title: 'التعاون والتواصل',
          content: 'أدوات التعاون والتواصل بين أعضاء الفريق.',
          steps: [
            {
              title: '1. إسناد التذاكر',
              description: 'حدد المسؤول عن كل تذكرة من خلال حقل "المكلف" أو "مراجع التذكرة".',
              benefit: 'الإسناد الواضح يمنع التداخل في المسؤوليات ويضمن المتابعة الفعالة، كما يسهل تحديد المسؤول عند الحاجة للاستفسار.'
            },
            {
              title: '2. التعليقات والمناقشات',
              description: 'استخدم نظام التعليقات لمناقشة التفاصيل وتوثيق القرارات.',
              benefit: 'التواصل المباشر في التذكرة يحفظ السياق ويقلل من الحاجة للاجتماعات، ويضمن وصول المعلومات لجميع المعنيين.'
            },
            {
              title: '3. الإشعارات',
              description: 'سيتم إرسال إشعارات تلقائية عند تحديث التذاكر أو تغيير المراحل.',
              benefit: 'الإشعارات التلقائية تضمن بقاء الجميع على اطلاع دون الحاجة للمراجعة المستمرة، مما يوفر الوقت ويحسن الاستجابة.'
            }
          ]
        }
      ]
    },
    {
      id: 'advanced-features',
      title: 'الميزات المتقدمة',
      icon: Zap,
      color: 'text-orange-600',
      subsections: [
        {
          id: 'automation',
          title: 'الأتمتة الذكية',
          content: 'إعداد قواعد الأتمتة لتحسين سير العمل وتوفير الوقت.',
          steps: [
            {
              title: '1. إنشاء قاعدة أتمتة',
              description: 'انتقل إلى الأتمتة واضغط "قاعدة جديدة". حدد المحفز (مثل تغيير المرحلة) والإجراء المطلوب.',
              benefit: 'الأتمتة تقلل من الأعمال الروتينية وتضمن تنفيذ الإجراءات بشكل متسق، مما يوفر الوقت ويقلل من الأخطاء البشرية.'
            },
            {
              title: '2. تكوين المحفزات',
              description: 'اختر من المحفزات المتاحة: تغيير المرحلة، تحديث حقل، اقتراب الموعد، التأخير، أو إنشاء تذكرة.',
              benefit: 'المحفزات المتنوعة تتيح أتمتة سيناريوهات مختلفة حسب احتياجات العمل، مما يجعل النظام يتكيف مع طبيعة عملك.'
            },
            {
              title: '3. تحديد الإجراءات',
              description: 'حدد الإجراءات التي ستحدث تلقائياً: إرسال إشعار، نقل لمرحلة، تحديث حقل، أو إنشاء تذكرة جديدة.',
              benefit: 'الإجراءات التلقائية تضمن الاستجابة الفورية للأحداث وتحسن من سرعة الاستجابة، خاصة في الحالات العاجلة.'
            }
          ]
        },
        {
          id: 'recurring-tickets',
          title: 'التذاكر المتكررة',
          content: 'إنشاء تذاكر تلقائية حسب جدول زمني محدد.',
          steps: [
            {
              title: '1. إنشاء قاعدة تكرار',
              description: 'انتقل إلى التذاكر المتكررة واختر العملية المطلوبة، ثم اضغط "قاعدة تكرار جديدة".',
              benefit: 'التذاكر المتكررة توفر الوقت في المهام الدورية وتضمن عدم نسيان المهام المنتظمة مثل التقارير الشهرية أو المراجعات الدورية.'
            },
            {
              title: '2. تصميم القالب',
              description: 'أنشئ قالب التذكرة مع العنوان، الوصف، الأولوية، والبيانات الافتراضية.',
              benefit: 'القوالب المحددة مسبقاً تضمن الاتساق في البيانات وتوفر الوقت في ملء التفاصيل المتكررة.'
            },
            {
              title: '3. تحديد الجدول الزمني',
              description: 'اختر نوع التكرار (يومي، أسبوعي، شهري) وحدد الوقت والتكرار المطلوب.',
              benefit: 'الجدولة الدقيقة تضمن إنشاء التذاكر في الأوقات المناسبة وتساعد في التخطيط المسبق للموارد والوقت.'
            }
          ]
        },
        {
          id: 'integrations',
          title: 'التكاملات الخارجية',
          content: 'ربط النظام مع الخدمات والأنظمة الخارجية.',
          steps: [
            {
              title: '1. إعداد Webhook',
              description: 'انتقل إلى التكاملات وأنشئ تكامل جديد. أدخل رابط الـ Webhook والأحداث المطلوب إرسالها.',
              benefit: 'التكامل مع الأنظمة الخارجية يوحد تدفق المعلومات ويقلل من الحاجة للتنقل بين تطبيقات متعددة، مما يحسن الكفاءة.'
            },
            {
              title: '2. تكامل Slack',
              description: 'استخدم القالب السريع لـ Slack وأدخل رابط الـ Webhook الخاص بقناتك.',
              benefit: 'تكامل Slack يضمن وصول الإشعارات المهمة لجميع أعضاء الفريق في مكان تواصلهم المعتاد، مما يحسن سرعة الاستجابة.'
            },
            {
              title: '3. تكامل البريد الإلكتروني',
              description: 'كوّن إعدادات SMTP في الإعدادات لإرسال إشعارات عبر البريد الإلكتروني.',
              benefit: 'البريد الإلكتروني يضمن وصول الإشعارات المهمة حتى عند عدم تواجد المستخدم في النظام، ويوفر سجل دائم للمراسلات.'
            }
          ]
        }
      ]
    },
    {
      id: 'reports-analytics',
      title: 'التقارير والتحليلات',
      icon: BarChart3,
      color: 'text-indigo-600',
      subsections: [
        {
          id: 'basic-reports',
          title: 'التقارير الأساسية',
          content: 'كيفية إنشاء وعرض التقارير الأساسية لمتابعة الأداء.',
          steps: [
            {
              title: '1. الوصول للتقارير',
              description: 'انتقل إلى قسم التقارير لعرض الإحصائيات العامة والرسوم البيانية.',
              benefit: 'التقارير توفر نظرة شاملة على الأداء وتساعد في اتخاذ قرارات مدروسة بناءً على البيانات الفعلية وليس التخمين.'
            },
            {
              title: '2. فلترة البيانات',
              description: 'استخدم فلاتر التاريخ والعملية لتخصيص التقارير حسب احتياجاتك.',
              benefit: 'الفلترة المرنة تتيح التركيز على البيانات المهمة وتسهل تحليل فترات أو عمليات محددة لفهم الاتجاهات والأنماط.'
            },
            {
              title: '3. تصدير التقارير',
              description: 'اضغط "تصدير" لحفظ التقرير كملف JSON أو طباعته.',
              benefit: 'تصدير التقارير يتيح مشاركتها مع الإدارة العليا أو استخدامها في عروض تقديمية، ويحفظ سجل دائم للأداء.'
            }
          ]
        },
        {
          id: 'performance-metrics',
          title: 'مؤشرات الأداء',
          content: 'فهم وتحليل مؤشرات الأداء الرئيسية.',
          steps: [
            {
              title: '1. معدل الإنجاز',
              description: 'نسبة التذاكر المكتملة من إجمالي التذاكر. مؤشر مهم لقياس الإنتاجية.',
              benefit: 'متابعة معدل الإنجاز تساعد في تحديد كفاءة الفريق وتحديد المجالات التي تحتاج تحسين أو موارد إضافية.'
            },
            {
              title: '2. متوسط وقت الإنجاز',
              description: 'الوقت المتوسط لإكمال التذاكر. يساعد في تحسين العمليات وتقدير المواعيد.',
              benefit: 'فهم أوقات الإنجاز يحسن من دقة التخطيط ويساعد في وضع مواعيد نهائية واقعية للعملاء والإدارة.'
            },
            {
              title: '3. التذاكر المتأخرة',
              description: 'عدد التذاكر التي تجاوزت موعدها النهائي. مؤشر مهم لإدارة المخاطر.',
              benefit: 'مراقبة التأخيرات تساعد في تحديد المشاكل مبكراً واتخاذ إجراءات تصحيحية قبل تفاقم الوضع وتأثيره على العملاء.'
            }
          ]
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'حل المشاكل',
      icon: HelpCircle,
      color: 'text-red-600',
      subsections: [
        {
          id: 'common-issues',
          title: 'المشاكل الشائعة',
          content: 'حلول للمشاكل الأكثر شيوعاً في استخدام النظام.',
          steps: [
            {
              title: 'لا يمكنني إنشاء تذكرة جديدة',
              description: 'تأكد من اختيار عملية أولاً، وأن لديك صلاحية إنشاء التذاكر في هذه العملية.',
              benefit: 'حل هذه المشكلة يمكنك من البدء في العمل فوراً ويضمن عدم تأخير المهام المهمة بسبب مشاكل تقنية بسيطة.'
            },
            {
              title: 'لا تظهر الإشعارات',
              description: 'تحقق من إعدادات الإشعارات في الملف الشخصي وتأكد من تفعيل الإشعارات المطلوبة.',
              benefit: 'إصلاح الإشعارات يضمن عدم فوات المهام المهمة ويحسن من التواصل والتنسيق مع أعضاء الفريق.'
            },
            {
              title: 'لا يمكنني نقل التذكرة',
              description: 'تأكد من وجود صلاحية تعديل التذاكر وأن قواعد الانتقال تسمح بالنقل للمرحلة المطلوبة.',
              benefit: 'القدرة على نقل التذاكر ضرورية لتدفق العمل السليم وتضمن تقدم المهام عبر المراحل المختلفة دون تعطيل.'
            },
            {
              title: 'البيانات لا تحفظ',
              description: 'تأكد من ملء جميع الحقول المطلوبة (المميزة بـ *) وأن اتصال الإنترنت مستقر.',
              benefit: 'حفظ البيانات بنجاح يضمن عدم فقدان العمل المنجز ويحافظ على استمرارية العمليات دون انقطاع.'
            }
          ]
        },
        {
          id: 'performance-tips',
          title: 'نصائح الأداء',
          content: 'نصائح لتحسين أداء النظام وسرعة الاستجابة.',
          steps: [
            {
              title: '1. تنظيم التذاكر',
              description: 'احرص على نقل التذاكر المكتملة إلى المرحلة الأخيرة وأرشف التذاكر القديمة.',
              benefit: 'التنظيم المستمر يحسن من أداء النظام ويسهل العثور على التذاكر النشطة، مما يزيد من سرعة الاستجابة.'
            },
            {
              title: '2. استخدام الفلاتر',
              description: 'استخدم فلاتر البحث والتصفية لتقليل عدد التذاكر المعروضة وتحسين الأداء.',
              benefit: 'الفلترة الذكية تقلل من التشتت وتساعد على التركيز على المهام ذات الأولوية، مما يحسن من الإنتاجية الشخصية.'
            },
            {
              title: '3. تحديث المتصفح',
              description: 'تأكد من استخدام أحدث إصدار من المتصفح وتفعيل JavaScript.',
              benefit: 'المتصفح المحدث يضمن الأمان والأداء الأمثل ويمنع المشاكل التقنية التي قد تعطل العمل.'
            }
          ]
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'أفضل الممارسات',
      icon: Target,
      color: 'text-emerald-600',
      subsections: [
        {
          id: 'workflow-design',
          title: 'تصميم سير العمل',
          content: 'أفضل الممارسات لتصميم عمليات فعالة ومرنة.',
          steps: [
            {
              title: '1. ابدأ بسيط',
              description: 'ابدأ بعدد قليل من المراحل (3-5 مراحل) ثم أضف المزيد حسب الحاجة.',
              benefit: 'البساطة في البداية تسهل التعلم والتبني من قبل الفريق، ويمكن التطوير تدريجياً بناءً على الخبرة المكتسبة.'
            },
            {
              title: '2. أسماء واضحة',
              description: 'استخدم أسماء واضحة ومفهومة للمراحل والحقول تعكس الغرض منها.',
              benefit: 'الأسماء الواضحة تقلل من الالتباس وتسرع عملية التدريب للموظفين الجدد، وتحسن من كفاءة العمل اليومي.'
            },
            {
              title: '3. ألوان منطقية',
              description: 'استخدم ألوان منطقية: أحمر للعاجل، أخضر للمكتمل، أصفر للانتظار.',
              benefit: 'الألوان المنطقية تسهل التعرف السريع على حالة المهام وتقلل من الوقت المطلوب لفهم الوضع الحالي.'
            },
            {
              title: '4. حقول مفيدة',
              description: 'أضف فقط الحقول الضرورية لتجنب تعقيد النموذج.',
              benefit: 'الحقول المدروسة تسرع عملية إدخال البيانات وتقلل من مقاومة المستخدمين للنظام، مما يحسن من معدل التبني.'
            }
          ]
        },
        {
          id: 'team-collaboration',
          title: 'التعاون الفعال',
          content: 'كيفية تحسين التعاون بين أعضاء الفريق.',
          steps: [
            {
              title: '1. توزيع المسؤوليات',
              description: 'حدد مسؤولاً واضحاً لكل تذكرة واستخدم حقل "مراجع التذكرة" للمتابعة.',
              benefit: 'التوزيع الواضح للمسؤوليات يمنع التداخل والازدواجية ويضمن المساءلة، مما يحسن من جودة النتائج وسرعة الإنجاز.'
            },
            {
              title: '2. التواصل المستمر',
              description: 'استخدم التعليقات بانتظام لتوثيق التقدم والقرارات المتخذة.',
              benefit: 'التواصل المستمر يبني الثقة بين أعضاء الفريق ويقلل من سوء الفهم، ويضمن أن الجميع على نفس الصفحة.'
            },
            {
              title: '3. المتابعة الدورية',
              description: 'راجع التذاكر المتأخرة والعالقة بانتظام واتخذ الإجراءات المناسبة.',
              benefit: 'المتابعة الدورية تمنع تراكم المشاكل وتضمن الحفاظ على مستوى الخدمة المطلوب، وتحسن من رضا العملاء.'
            }
          ]
        }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.subsections.some(sub => 
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const currentSection = helpSections.find(s => s.id === selectedSection);
  const currentSubsection = currentSection?.subsections.find(s => s.id === selectedSubsection);

  return (
    <div className="h-full bg-gray-50 flex" dir="rtl">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">مركز المساعدة</h1>
              <p className="text-sm text-gray-500">دليل شامل للنظام</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث في المساعدة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections.includes(section.id);
              
              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-right ${
                      selectedSection === section.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Icon className={`w-5 h-5 ${section.color}`} />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="mr-8 mt-2 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => {
                            setSelectedSection(section.id);
                            setSelectedSubsection(subsection.id);
                          }}
                          className={`w-full text-right p-2 rounded-md transition-colors text-sm ${
                            selectedSubsection === subsection.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {subsection.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              {currentSection && (
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <div className={`w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center`}>
                    <currentSection.icon className={`w-4 h-4 ${currentSection.color}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentSubsection?.title}</h2>
                    <p className="text-gray-500 text-sm">{currentSection.title}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <button className="flex items-center space-x-2 space-x-reverse px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Copy className="w-4 h-4" />
                <span>نسخ الرابط</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <ExternalLink className="w-4 h-4" />
                <span>فتح في نافذة جديدة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {currentSubsection && (
              <article className="prose prose-lg max-w-none">
                {/* Introduction */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <p className="text-blue-800 leading-relaxed m-0">
                    {currentSubsection.content}
                  </p>
                </div>

                {/* Steps */}
                {currentSubsection.steps && (
                  <div className="space-y-6">
                    {currentSubsection.steps.map((step, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-start space-x-4 space-x-reverse">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              {step.title}
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                              {step.description}
                            </p>
                            
                            {/* Benefits Section */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start space-x-2 space-x-reverse">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-green-900 mb-1">الفائدة والهدف:</h4>
                                  <p className="text-green-800 text-sm leading-relaxed">
                                    {step.benefit}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {step.code && (
                              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-400 text-sm">مثال:</span>
                                  <button className="text-gray-400 hover:text-white">
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                                <pre className="text-green-400 text-sm overflow-x-auto">
                                  <code>{step.code}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tips */}
                {currentSubsection.tips && (
                  <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="flex items-center space-x-2 space-x-reverse text-yellow-900 font-semibold mb-4">
                      <Lightbulb className="w-5 h-5" />
                      <span>نصائح مفيدة</span>
                    </h4>
                    <ul className="space-y-2">
                      {currentSubsection.tips.map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2 space-x-reverse text-yellow-800">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {currentSection && (
                      <>
                        <span className="text-gray-500 text-sm">في هذا القسم:</span>
                        <span className="text-blue-600 text-sm font-medium">{currentSection.title}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span>السابق</span>
                    </button>
                    <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      <span>التالي</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};