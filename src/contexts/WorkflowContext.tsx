import React, { createContext, useContext, useState, useEffect } from 'react';
import { Process, Ticket, Stage, ProcessField } from '../types/workflow';
import { useAuth } from './AuthContext';

interface WorkflowContextType {
  processes: Process[];
  tickets: Ticket[];
  selectedProcess: Process | null;
  setSelectedProcess: (process: Process | null) => void;
  createTicket: (ticketData: Partial<Ticket>) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  moveTicket: (ticketId: string, toStageId: string) => void;
  deleteTicket: (ticketId: string) => void;
  loading: boolean;
  createProcess: (processData: Partial<Process>) => void;
  updateProcess: (processId: string, updates: Partial<Process>) => Promise<boolean>;
  deleteProcess: (processId: string) => Promise<boolean>;
  getProcessUsers: (processId: string) => User[];
  addFieldToProcess: (processId: string, newField: ProcessField) => void;
  removeFieldFromProcess: (processId: string, fieldId: string) => void;
  addStageToProcess: (processId: string, newStage: Stage) => void;
  updateStageInProcess: (processId: string, updatedStage: Stage) => void;
  removeStageFromProcess: (processId: string, stageId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // انتظار تحميل المصادقة أولاً
    if (!authLoading) {
      // جلب البيانات من API
      loadProcessesFromAPI();
    }
  }, [authLoading, isAuthenticated]);

  // إنشاء بيانات تجريبية كبيرة
  const generateLargeTicketData = (mockProcesses: Process[]) => {
    const largeTickets: Ticket[] = [];
    const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
    const sampleTitles = [
      'شراء أجهزة كمبيوتر جديدة',
      'صيانة الطابعات',
      'تحديث البرامج',
      'طلب مواد مكتبية',
      'إصلاح التكييف',
      'تركيب كاميرات مراقبة',
      'شراء أثاث مكتبي',
      'تطوير موقع إلكتروني',
      'تدريب الموظفين',
      'مراجعة الأمان',
      'تحديث الشبكة',
      'شراء معدات',
      'إعداد قاعة اجتماعات',
      'تطوير تطبيق جوال',
      'مراجعة العقود',
      'تحسين الأداء',
      'إدارة المخزون',
      'تطوير النظام',
      'تحليل البيانات',
      'إعداد التقارير'
    ];

    const sampleDescriptions = [
      'وصف مفصل للمهمة المطلوبة مع جميع التفاصيل اللازمة للتنفيذ',
      'تحديد المتطلبات والمواصفات الفنية المطلوبة',
      'مراجعة شاملة للوضع الحالي وتحديد نقاط التحسين',
      'تنسيق مع الأقسام المختلفة لضمان التنفيذ السليم',
      'متابعة التقدم وإعداد التقارير الدورية',
      'ضمان الجودة والالتزام بالمعايير المطلوبة',
      'تدريب الفريق على الأدوات والعمليات الجديدة',
      'اختبار شامل للتأكد من سلامة التنفيذ',
      'توثيق العمليات وإعداد الأدلة الإرشادية',
      'تقييم النتائج وقياس مستوى الرضا'
    ];

    const sampleComments = [
      'تم البدء في العمل على هذه المهمة',
      'هناك تأخير بسيط بسبب عدم توفر المواد',
      'تم الانتهاء من المرحلة الأولى بنجاح',
      'يحتاج إلى مراجعة إضافية من المدير',
      'تم حل المشكلة وجاري المتابعة',
      'نحتاج إلى موافقة إضافية للمتابعة',
      'العمل يسير وفق الخطة المحددة',
      'تم تحديث المتطلبات حسب الطلب',
      'انتظار رد من العميل للمتابعة',
      'تم الانتهاء من الاختبارات بنجاح'
    ];

    const sampleAttachments = [
      { name: 'مواصفات_المشروع.pdf', type: 'application/pdf', size: 2048000 },
      { name: 'صور_الموقع.jpg', type: 'image/jpeg', size: 1024000 },
      { name: 'جدول_زمني.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 512000 },
      { name: 'تقرير_التقدم.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 768000 },
      { name: 'رسم_تخطيطي.png', type: 'image/png', size: 1536000 }
    ];

    // إنشاء 60 تذكرة لكل عملية
    mockProcesses.forEach((process) => {
      // التأكد من وجود مراحل في العملية
      if (!process.stages || process.stages.length === 0) {
        return; // تخطي هذه العملية إذا لم تكن لها مراحل
      }

      for (let i = 0; i < 60; i++) {
        const stageIndex = Math.floor(Math.random() * process.stages.length);
        const stage = process.stages[stageIndex];

        // التأكد من وجود المرحلة
        if (!stage || !stage.id) {
          continue; // تخطي هذه التذكرة إذا كانت المرحلة غير صحيحة
        }

        const titleIndex = Math.floor(Math.random() * sampleTitles.length);
        const descIndex = Math.floor(Math.random() * sampleDescriptions.length);
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        // إنشاء تعليقات عشوائية
        const numComments = Math.floor(Math.random() * 5) + 1;
        const activities: Activity[] = [];
        for (let j = 0; j < numComments; j++) {
          activities.push({
            id: `${process.id}-${i}-activity-${j}`,
            ticket_id: `${process.id}-ticket-${i}`,
            user_id: '1',
            type: 'comment_added',
            description: sampleComments[Math.floor(Math.random() * sampleComments.length)],
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        // إنشاء مرفقات عشوائية
        const numAttachments = Math.floor(Math.random() * 3);
        const attachments: Attachment[] = [];
        for (let k = 0; k < numAttachments; k++) {
          const attachment = sampleAttachments[Math.floor(Math.random() * sampleAttachments.length)];
          attachments.push({
            id: `${process.id}-${i}-attachment-${k}`,
            name: attachment.name,
            url: `#`,
            type: attachment.type,
            size: attachment.size,
            uploaded_by: '1',
            uploaded_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        const ticket: Ticket = {
          id: `${process.id}-ticket-${i}`,
          title: `${sampleTitles[titleIndex]} ${i + 1}`,
          description: sampleDescriptions[descIndex],
          process_id: process.id,
          current_stage_id: stage.id,
          created_by: '1',
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          priority,
          data: {
            amount: Math.floor(Math.random() * 100000) + 1000,
            supplier: `مورد ${Math.floor(Math.random() * 10) + 1}`,
            department: ['it', 'hr', 'finance'][Math.floor(Math.random() * 3)]
          },
          attachments,
          activities,
          tags: Math.random() > 0.5 ? [
            { id: `tag-${i}`, name: ['عاجل', 'مهم', 'متابعة', 'جديد'][Math.floor(Math.random() * 4)], color: ['bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800'][Math.floor(Math.random() * 4)] }
          ] : []
        };

        largeTickets.push(ticket);
      }
    });

    return largeTickets;
  };

  const loadProcessesFromAPI = async () => {
    setLoading(true);

    try {
      // جلب رمز المصادقة من localStorage
      const token = localStorage.getItem('auth_token');
      console.log("token==="+token);
      // جلب العمليات من API
      const response = await fetch('http://localhost:3000/api/processes/frontend', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      if (data.success && data.data) {
        // تحويل البيانات إلى تنسيق Process
        const apiProcesses: Process[] = data.data.map((process: any) => ({
          id: process.id.toString(),
          name: process.name,
          description: process.description || '',
          color: process.color || 'bg-blue-500',
          icon: process.icon || 'FolderOpen',
          created_by: process.created_by?.toString() || '1',
          created_at: process.created_at,
          is_active: process.is_active,
          stages: (process.stages || []).map((stage: any) => ({
            id: stage.id.toString(),
            name: stage.name,
            color: stage.color || 'bg-gray-500',
            order: stage.order || 1,
            priority: stage.priority || 1,
            description: stage.description || '',
            fields: stage.fields || [],
            transition_rules: (stage.transition_rules || []).map((rule: any) => ({
              id: rule.id.toString(),
              from_stage_id: rule.from_stage_id.toString(),
              to_stage_id: rule.to_stage_id.toString(),
              is_default: rule.is_default || false,
              transition_type: rule.transition_type || 'single'
            })),
            automation_rules: stage.automation_rules || [],
            allowed_transitions: stage.allowed_transitions || [],
            is_initial: stage.is_initial || false
          })),
          fields: (process.fields || []).map((field: any) => ({
            id: field.id.toString(),
            name: field.name,
            type: field.type,
            required: field.required || false,
            options: field.options || [],
            description: field.description || '',
            order: field.order || 1,
            validation_rules: field.validation_rules || {},
            default_value: field.default_value,
            placeholder: field.placeholder || '',
            help_text: field.help_text || ''
          })),
          settings: process.settings || {
            auto_assign: false,
            due_date_required: false,
            priority_required: false,
            allow_attachments: true,
            allow_comments: true,
            default_priority: 'medium',
            notification_settings: {
              email_notifications: true,
              in_app_notifications: true,
              notify_on_assignment: true,
              notify_on_stage_change: true,
              notify_on_due_date: true,
              notify_on_overdue: true
            }
          }
        }));

        setProcesses(apiProcesses);

        // إنشاء بيانات تجريبية للتذاكر إذا كانت العمليات موجودة
        if (apiProcesses.length > 0) {
          const mockTickets = generateLargeTicketData(apiProcesses);
          setTickets(mockTickets);
          setSelectedProcess(apiProcesses[0]);
        }

      } else {
        console.error('فشل في جلب العمليات:', data.message);
        // في حالة الفشل، استخدم بيانات تجريبية بسيطة
        loadFallbackData();
      }

    } catch (error) {
      console.error('خطأ في جلب العمليات من API:', error);
      // في حالة الخطأ، استخدم بيانات تجريبية بسيطة
      // loadFallbackData();
    }

    setLoading(false);
  };

  const loadFallbackData = () => {
    // بيانات تجريبية بسيطة في حالة فشل API
    const fallbackProcesses: Process[] = [
      {
        id: '1',
        name: 'المشتريات',
        description: 'إدارة عمليات الشراء والتوريد',
        color: 'bg-blue-500',
        icon: 'ShoppingCart',
        created_by: '1',
        created_at: new Date().toISOString(),
        is_active: true,
        stages: [
          {
            id: '1-1',
            name: 'طلب جديد',
            color: 'bg-gray-500',
            order: 1,
            priority: 1,
            description: 'طلبات شراء جديدة',
            fields: [],
            transition_rules: [
              { id: '1', from_stage_id: '1-1', to_stage_id: '1-2', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['1-2'],
            is_initial: true
          },
          {
            id: '1-2',
            name: 'مراجعة',
            color: 'bg-yellow-500',
            order: 2,
            priority: 2,
            description: 'مراجعة الطلبات',
            fields: [],
            transition_rules: [
              { id: '2', from_stage_id: '1-2', to_stage_id: '1-3', is_default: true, transition_type: 'single' },
              { id: '3', from_stage_id: '1-2', to_stage_id: '1-1', transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['1-3', '1-1']
          },
          {
            id: '1-3',
            name: 'موافقة',
            color: 'bg-green-500',
            order: 3,
            priority: 3,
            description: 'موافقة على الطلبات',
            fields: [],
            transition_rules: [
              { id: '4', from_stage_id: '1-3', to_stage_id: '1-4', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['1-4', '1-2']
          },
          {
            id: '1-4',
            name: 'تنفيذ',
            color: 'bg-blue-500',
            order: 4,
            priority: 4,
            description: 'تنفيذ عمليات الشراء',
            fields: [],
            transition_rules: [
              { id: '5', from_stage_id: '1-4', to_stage_id: '1-5', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['1-5']
          },
          {
            id: '1-5',
            name: 'مكتمل',
            color: 'bg-green-600',
            order: 5,
            priority: 5,
            description: 'عمليات مكتملة',
            fields: [],
            transition_rules: [],
            automation_rules: [],
            allowed_transitions: [],
            is_final: true
          }
        ],
        fields: [
          {
            id: 'title',
            name: 'العنوان',
            type: 'text',
            is_required: true,
            is_system_field: true
          },
          {
            id: 'amount',
            name: 'المبلغ',
            type: 'number',
            is_required: true,
            is_system_field: false,
            default_value: 0
          },
          {
            id: 'supplier',
            name: 'المورد',
            type: 'text',
            is_required: false,
            is_system_field: false
          },
          {
            id: 'department',
            name: 'القسم المطلوب',
            type: 'select',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'it', label: 'تكنولوجيا المعلومات', value: 'it', color: 'bg-blue-100' },
              { id: 'hr', label: 'الموارد البشرية', value: 'hr', color: 'bg-green-100' },
              { id: 'finance', label: 'المالية', value: 'finance', color: 'bg-yellow-100' },
              { id: 'operations', label: 'العمليات', value: 'operations', color: 'bg-purple-100' }
            ]
          },
          {
            id: 'urgency',
            name: 'مستوى الاستعجال',
            type: 'radio',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'normal', label: 'عادي', value: 'normal', color: 'bg-gray-100' },
              { id: 'urgent', label: 'عاجل', value: 'urgent', color: 'bg-orange-100' },
              { id: 'critical', label: 'حرج', value: 'critical', color: 'bg-red-100' }
            ]
          },
          {
            id: 'budget_approved',
            name: 'الميزانية معتمدة',
            type: 'checkbox',
            is_required: false,
            is_system_field: false
          },
          {
            id: 'purchase_reviewer',
            name: 'مراجع طلب الشراء',
            type: 'ticket_reviewer',
            is_required: true,
            is_system_field: false
          }
        ],
        settings: {
          auto_assign: false,
          due_date_required: true,
          allow_self_assignment: true,
          default_priority: 'medium',
          notification_settings: {
            email_notifications: true,
            in_app_notifications: true,
            notify_on_assignment: true,
            notify_on_stage_change: true,
            notify_on_due_date: true,
            notify_on_overdue: true
          }
        }
      },
      {
        id: '2',
        name: 'التوظيف',
        description: 'إدارة عمليات التوظيف والموارد البشرية',
        color: 'bg-purple-500',
        icon: 'Users',
        created_by: '1',
        created_at: new Date().toISOString(),
        is_active: true,
        stages: [
          {
            id: '2-1',
            name: 'طلب توظيف',
            color: 'bg-gray-500',
            order: 1,
            priority: 1,
            fields: [],
            transition_rules: [
              { id: '6', from_stage_id: '2-1', to_stage_id: '2-2', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['2-2'],
            is_initial: true
          },
          {
            id: '2-2',
            name: 'فرز المتقدمين',
            color: 'bg-yellow-500',
            order: 2,
            priority: 2,
            fields: [],
            transition_rules: [
              { id: '7', from_stage_id: '2-2', to_stage_id: '2-3', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['2-3', '2-1']
          },
          {
            id: '2-3',
            name: 'مقابلات',
            color: 'bg-blue-500',
            order: 3,
            priority: 3,
            fields: [],
            transition_rules: [
              { id: '8', from_stage_id: '2-3', to_stage_id: '2-4', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['2-4', '2-2']
          },
          {
            id: '2-4',
            name: 'اتخاذ قرار',
            color: 'bg-green-500',
            order: 4,
            priority: 4,
            fields: [],
            transition_rules: [
              { id: '9', from_stage_id: '2-4', to_stage_id: '2-5', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['2-5', '2-3']
          },
          {
            id: '2-5',
            name: 'تم التوظيف',
            color: 'bg-green-600',
            order: 5,
            priority: 5,
            fields: [],
            transition_rules: [],
            automation_rules: [],
            allowed_transitions: [],
            is_final: true
          }
        ],
        fields: [
          {
            id: 'position',
            name: 'المنصب',
            type: 'text',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'department',
            name: 'القسم',
            type: 'select',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'it', label: 'تكنولوجيا المعلومات', value: 'it' },
              { id: 'hr', label: 'الموارد البشرية', value: 'hr' },
              { id: 'finance', label: 'المالية', value: 'finance' }
            ]
          },
          {
            id: 'experience_years',
            name: 'سنوات الخبرة المطلوبة',
            type: 'number',
            is_required: true,
            is_system_field: false,
            default_value: 1
          },
          {
            id: 'salary_range',
            name: 'نطاق الراتب',
            type: 'text',
            is_required: false,
            is_system_field: false
          },
          {
            id: 'job_type',
            name: 'نوع الوظيفة',
            type: 'select',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'fulltime', label: 'دوام كامل', value: 'fulltime', color: 'bg-green-100' },
              { id: 'parttime', label: 'دوام جزئي', value: 'parttime', color: 'bg-blue-100' },
              { id: 'contract', label: 'عقد مؤقت', value: 'contract', color: 'bg-yellow-100' },
              { id: 'remote', label: 'عمل عن بعد', value: 'remote', color: 'bg-purple-100' }
            ]
          },
          {
            id: 'skills_required',
            name: 'المهارات المطلوبة',
            type: 'multiselect',
            is_required: false,
            is_system_field: false,
            options: [
              { id: 'programming', label: 'البرمجة', value: 'programming', color: 'bg-blue-100' },
              { id: 'design', label: 'التصميم', value: 'design', color: 'bg-pink-100' },
              { id: 'management', label: 'الإدارة', value: 'management', color: 'bg-green-100' },
              { id: 'marketing', label: 'التسويق', value: 'marketing', color: 'bg-orange-100' },
              { id: 'sales', label: 'المبيعات', value: 'sales', color: 'bg-red-100' }
            ]
          }
        ],
        settings: {
          auto_assign: true,
          due_date_required: false,
          allow_self_assignment: false,
          default_priority: 'medium',
          notification_settings: {
            email_notifications: true,
            in_app_notifications: true,
            notify_on_assignment: true,
            notify_on_stage_change: true,
            notify_on_due_date: false,
            notify_on_overdue: false
          }
        }
      },
      {
        id: '3',
        name: 'الشكاوى',
        description: 'إدارة شكاوى العملاء والموظفين',
        color: 'bg-red-500',
        icon: 'AlertTriangle',
        created_by: '1',
        created_at: new Date().toISOString(),
        is_active: true,
        stages: [
          {
            id: '3-1',
            name: 'شكوى جديدة',
            color: 'bg-red-500',
            order: 1,
            priority: 1,
            fields: [],
            transition_rules: [
              { id: '10', from_stage_id: '3-1', to_stage_id: '3-2', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['3-2'],
            is_initial: true
          },
          {
            id: '3-2',
            name: 'قيد المراجعة',
            color: 'bg-yellow-500',
            order: 2,
            priority: 2,
            fields: [],
            transition_rules: [
              { id: '11', from_stage_id: '3-2', to_stage_id: '3-3', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['3-3', '3-1']
          },
          {
            id: '3-3',
            name: 'قيد الحل',
            color: 'bg-blue-500',
            order: 3,
            priority: 3,
            fields: [],
            transition_rules: [
              { id: '12', from_stage_id: '3-3', to_stage_id: '3-4', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['3-4', '3-2']
          },
          {
            id: '3-4',
            name: 'تم الحل',
            color: 'bg-green-500',
            order: 4,
            priority: 4,
            fields: [],
            transition_rules: [],
            automation_rules: [],
            allowed_transitions: [],
            is_final: true
          }
        ],
        fields: [
          {
            id: 'complaint_type',
            name: 'نوع الشكوى',
            type: 'select',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'service', label: 'خدمة عملاء', value: 'service' },
              { id: 'product', label: 'منتج معيب', value: 'product' },
              { id: 'billing', label: 'فوترة', value: 'billing' }
            ]
          },
          {
            id: 'customer_info',
            name: 'بيانات العميل',
            type: 'textarea',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'customer_phone',
            name: 'رقم هاتف العميل',
            type: 'phone',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'customer_email',
            name: 'بريد العميل الإلكتروني',
            type: 'email',
            is_required: false,
            is_system_field: false
          },
          {
            id: 'incident_date',
            name: 'تاريخ الحادثة',
            type: 'date',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'severity',
            name: 'درجة الخطورة',
            type: 'radio',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'low', label: 'منخفضة', value: 'low', color: 'bg-green-100' },
              { id: 'medium', label: 'متوسطة', value: 'medium', color: 'bg-yellow-100' },
              { id: 'high', label: 'عالية', value: 'high', color: 'bg-red-100' }
            ]
          }
        ],
        settings: {
          auto_assign: true,
          due_date_required: true,
          allow_self_assignment: true,
          default_priority: 'high',
          notification_settings: {
            email_notifications: true,
            in_app_notifications: true,
            notify_on_assignment: true,
            notify_on_stage_change: true,
            notify_on_due_date: true,
            notify_on_overdue: true
          }
        }
      },
      {
        id: '4',
        name: 'المشاريع',
        description: 'إدارة المشاريع والمهام',
        color: 'bg-green-500',
        icon: 'FolderOpen',
        created_by: '1',
        created_at: new Date().toISOString(),
        is_active: true,
        stages: [
          {
            id: '4-1',
            name: 'تخطيط',
            color: 'bg-blue-500',
            order: 1,
            priority: 1,
            fields: [],
            transition_rules: [
              { id: '13', from_stage_id: '4-1', to_stage_id: '4-2', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['4-2'],
            is_initial: true
          },
          {
            id: '4-2',
            name: 'تنفيذ',
            color: 'bg-orange-500',
            order: 2,
            priority: 2,
            fields: [],
            transition_rules: [
              { id: '14', from_stage_id: '4-2', to_stage_id: '4-3', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['4-3', '4-1']
          },
          {
            id: '4-3',
            name: 'مراجعة',
            color: 'bg-purple-500',
            order: 3,
            priority: 3,
            fields: [],
            transition_rules: [
              { id: '15', from_stage_id: '4-3', to_stage_id: '4-4', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['4-4', '4-2']
          },
          {
            id: '4-4',
            name: 'مكتمل',
            color: 'bg-green-600',
            order: 4,
            priority: 4,
            fields: [],
            transition_rules: [],
            automation_rules: [],
            allowed_transitions: [],
            is_final: true
          }
        ],
        fields: [
          {
            id: 'project_type',
            name: 'نوع المشروع',
            type: 'select',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'web', label: 'تطوير ويب', value: 'web' },
              { id: 'mobile', label: 'تطبيق جوال', value: 'mobile' },
              { id: 'design', label: 'تصميم', value: 'design' }
            ]
          },
          {
            id: 'budget',
            name: 'الميزانية',
            type: 'number',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'client_name',
            name: 'اسم العميل',
            type: 'text',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'project_duration',
            name: 'مدة المشروع (بالأسابيع)',
            type: 'number',
            is_required: true,
            is_system_field: false,
            default_value: 4
          },
          {
            id: 'technologies',
            name: 'التقنيات المطلوبة',
            type: 'multiselect',
            is_required: false,
            is_system_field: false,
            options: [
              { id: 'react', label: 'React', value: 'react', color: 'bg-blue-100' },
              { id: 'nodejs', label: 'Node.js', value: 'nodejs', color: 'bg-green-100' },
              { id: 'python', label: 'Python', value: 'python', color: 'bg-yellow-100' },
              { id: 'flutter', label: 'Flutter', value: 'flutter', color: 'bg-cyan-100' },
              { id: 'figma', label: 'Figma', value: 'figma', color: 'bg-purple-100' }
            ]
          },
          {
            id: 'has_deadline',
            name: 'يوجد موعد نهائي محدد',
            type: 'checkbox',
            is_required: false,
            is_system_field: false
          },
          {
            id: 'project_reviewer',
            name: 'مراجع المشروع',
            type: 'ticket_reviewer',
            is_required: true,
            is_system_field: false
          }
        ],
        settings: {
          auto_assign: false,
          due_date_required: true,
          allow_self_assignment: true,
          default_priority: 'medium',
          notification_settings: {
            email_notifications: true,
            in_app_notifications: true,
            notify_on_assignment: true,
            notify_on_stage_change: true,
            notify_on_due_date: true,
            notify_on_overdue: true
          }
        }
      },
      {
        id: '5',
        name: 'الصيانة',
        description: 'طلبات الصيانة والدعم الفني',
        color: 'bg-yellow-500',
        icon: 'Wrench',
        created_by: '1',
        created_at: new Date().toISOString(),
        is_active: true,
        stages: [
          {
            id: '5-1',
            name: 'طلب جديد',
            color: 'bg-gray-500',
            order: 1,
            priority: 1,
            fields: [],
            transition_rules: [
              { id: '16', from_stage_id: '5-1', to_stage_id: '5-2', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['5-2'],
            is_initial: true
          },
          {
            id: '5-2',
            name: 'قيد الفحص',
            color: 'bg-blue-500',
            order: 2,
            priority: 2,
            fields: [],
            transition_rules: [
              { id: '17', from_stage_id: '5-2', to_stage_id: '5-3', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['5-3', '5-1']
          },
          {
            id: '5-3',
            name: 'قيد الإصلاح',
            color: 'bg-orange-500',
            order: 3,
            priority: 3,
            fields: [],
            transition_rules: [
              { id: '18', from_stage_id: '5-3', to_stage_id: '5-4', is_default: true, transition_type: 'single' }
            ],
            automation_rules: [],
            allowed_transitions: ['5-4', '5-2']
          },
          {
            id: '5-4',
            name: 'تم الإصلاح',
            color: 'bg-green-500',
            order: 4,
            priority: 4,
            fields: [],
            transition_rules: [],
            automation_rules: [],
            allowed_transitions: [],
            is_final: true
          }
        ],
        fields: [
          {
            id: 'device_type',
            name: 'نوع الجهاز',
            type: 'text',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'issue_description',
            name: 'وصف المشكلة',
            type: 'textarea',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'device_location',
            name: 'موقع الجهاز',
            type: 'select',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'office_1', label: 'مكتب الطابق الأول', value: 'office_1', color: 'bg-blue-100' },
              { id: 'office_2', label: 'مكتب الطابق الثاني', value: 'office_2', color: 'bg-green-100' },
              { id: 'meeting_room', label: 'قاعة الاجتماعات', value: 'meeting_room', color: 'bg-purple-100' },
              { id: 'warehouse', label: 'المستودع', value: 'warehouse', color: 'bg-yellow-100' }
            ]
          },
          {
            id: 'warranty_status',
            name: 'حالة الضمان',
            type: 'radio',
            is_required: true,
            is_system_field: false,
            options: [
              { id: 'under_warranty', label: 'تحت الضمان', value: 'under_warranty', color: 'bg-green-100' },
              { id: 'expired_warranty', label: 'انتهى الضمان', value: 'expired_warranty', color: 'bg-red-100' },
              { id: 'unknown', label: 'غير معروف', value: 'unknown', color: 'bg-gray-100' }
            ]
          },
          {
            id: 'contact_person',
            name: 'الشخص المسؤول',
            type: 'text',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'contact_phone',
            name: 'رقم الهاتف للتواصل',
            type: 'phone',
            is_required: true,
            is_system_field: false
          },
          {
            id: 'maintenance_reviewer',
            name: 'مراجع طلب الصيانة',
            type: 'ticket_reviewer',
            is_required: false,
            is_system_field: false
          },
          {
            id: 'complaint_reviewer',
            name: 'مراجع الشكوى',
            type: 'ticket_reviewer',
            is_required: true,
            is_system_field: false
          }
        ],
        settings: {
          auto_assign: true,
          due_date_required: false,
          allow_self_assignment: true,
          default_priority: 'high',
          notification_settings: {
            email_notifications: true,
            in_app_notifications: true,
            notify_on_assignment: true,
            notify_on_stage_change: true,
            notify_on_due_date: true,
            notify_on_overdue: true
          }
        }
      }
    ];

    // إنشاء بيانات تجريبية كبيرة
    const mockTickets = generateLargeTicketData(fallbackProcesses);

    setProcesses(fallbackProcesses);
    setTickets(mockTickets);
    setSelectedProcess(fallbackProcesses[0]);
    setLoading(false);
  };

  const createTicket = (ticketData: Partial<Ticket>) => {
    const newTicket: Ticket = {
      id: Date.now().toString(),
      title: ticketData.title || '',
      description: ticketData.description,
      process_id: ticketData.process_id || selectedProcess?.id || '',
      current_stage_id: ticketData.current_stage_id || selectedProcess?.stages[0]?.id || '',
      created_by: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: ticketData.priority || 'medium',
      data: ticketData.data || {},
      attachments: [],
      activities: [{
        id: Date.now().toString(),
        ticket_id: Date.now().toString(),
        user_id: '1',
        user_name: 'أحمد محمد',
        type: 'created',
        description: 'تم إنشاء التذكرة',
        created_at: new Date().toISOString()
      }],
      tags: ticketData.tags || []
    };

    setTickets(prev => [...prev, newTicket]);
  };

  const updateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const currentTicket = tickets.find(t => t.id === ticketId);
    if (!currentTicket) return;

    // إنشاء سجلات للتغييرات
    const newActivities: Activity[] = [];
    const currentTime = new Date().toISOString();

    // تتبع تغيير العنوان
    if (updates.title && updates.title !== currentTicket.title) {
      newActivities.push({
        id: `${Date.now()}-title`,
        ticket_id: ticketId,
        user_id: '1',
        user_name: 'أحمد محمد',
        type: 'title_changed',
        description: `تم تغيير العنوان من "${currentTicket.title}" إلى "${updates.title}"`,
        created_at: currentTime,
        old_value: currentTicket.title,
        new_value: updates.title,
        field_name: 'العنوان'
      });
    }

    // تتبع تغيير الوصف
    if (updates.description !== undefined && updates.description !== currentTicket.description) {
      newActivities.push({
        id: `${Date.now()}-desc`,
        ticket_id: ticketId,
        user_id: '1',
        user_name: 'أحمد محمد',
        type: 'description_changed',
        description: `تم تحديث الوصف`,
        created_at: currentTime,
        old_value: currentTicket.description,
        new_value: updates.description,
        field_name: 'الوصف'
      });
    }

    // تتبع تغيير الأولوية
    if (updates.priority && updates.priority !== currentTicket.priority) {
      const priorityLabels = {
        low: 'منخفض',
        medium: 'متوسط', 
        high: 'عاجل',
        urgent: 'عاجل جداً'
      };
      
      newActivities.push({
        id: `${Date.now()}-priority`,
        ticket_id: ticketId,
        user_id: '1',
        user_name: 'أحمد محمد',
        type: 'priority_changed',
        description: `تم تغيير الأولوية من "${priorityLabels[currentTicket.priority]}" إلى "${priorityLabels[updates.priority]}"`,
        created_at: currentTime,
        old_value: currentTicket.priority,
        new_value: updates.priority,
        field_name: 'الأولوية'
      });
    }

    // تتبع تغيير تاريخ الاستحقاق
    if (updates.due_date !== undefined && updates.due_date !== currentTicket.due_date) {
      const oldDate = currentTicket.due_date ? new Date(currentTicket.due_date).toLocaleDateString('ar-SA') : 'غير محدد';
      const newDate = updates.due_date ? new Date(updates.due_date).toLocaleDateString('ar-SA') : 'غير محدد';
      
      newActivities.push({
        id: `${Date.now()}-due`,
        ticket_id: ticketId,
        user_id: '1',
        user_name: 'أحمد محمد',
        type: 'due_date_changed',
        description: `تم تغيير تاريخ الاستحقاق من "${oldDate}" إلى "${newDate}"`,
        created_at: currentTime,
        old_value: currentTicket.due_date,
        new_value: updates.due_date,
        field_name: 'تاريخ الاستحقاق'
      });
    }

    // تتبع تغيير الحقول المخصصة
    if (updates.data) {
      Object.keys(updates.data).forEach(fieldKey => {
        const oldValue = currentTicket.data?.[fieldKey];
        const newValue = updates.data![fieldKey];
        
        if (oldValue !== newValue) {
          // البحث عن اسم الحقل من العملية
          const process = processes.find(p => p.id === currentTicket.process_id);
          const field = process?.fields.find(f => f.id === fieldKey);
          const fieldName = field?.name || fieldKey;
          
          // معالجة خاصة لحقل مراجع التذكرة
          if (field?.type === 'ticket_reviewer') {
            const processUsers = getProcessUsers(currentTicket.process_id);
            const oldUser = processUsers.find(u => u.id === oldValue);
            const newUser = processUsers.find(u => u.id === newValue);
            
            newActivities.push({
              id: `${Date.now()}-reviewer-${fieldKey}`,
              ticket_id: ticketId,
              user_id: '1',
              user_name: 'أحمد محمد',
              type: 'reviewer_assigned',
              description: `تم ${oldValue ? 'تغيير' : 'تعيين'} ${fieldName} ${oldValue ? `من "${oldUser?.name}" إلى "${newUser?.name}"` : `إلى "${newUser?.name}"`}`,
              created_at: currentTime,
              old_value: oldUser?.name || null,
              new_value: newUser?.name || null,
              field_name: fieldName
            });
          } else {
            newActivities.push({
              id: `${Date.now()}-field-${fieldKey}`,
              ticket_id: ticketId,
              user_id: '1',
              user_name: 'أحمد محمد',
              type: 'field_updated',
              description: `تم تحديث ${fieldName} من "${oldValue || 'فارغ'}" إلى "${newValue || 'فارغ'}"`,
              created_at: currentTime,
              old_value: oldValue,
              new_value: newValue,
              field_name: fieldName
            });
          }
        }
      });
    }

    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            ...updates, 
            updated_at: new Date().toISOString(),
            activities: [
              ...(ticket.activities || []),
              ...newActivities,
              ...(updates.activities && updates.activities.length > (ticket.activities?.length || 0) 
                ? updates.activities.slice(ticket.activities?.length || 0) 
                : [])
            ]
          }
        : ticket
    ));
  };

  const moveTicket = (ticketId: string, toStageId: string) => {
    const currentTicket = tickets.find(t => t.id === ticketId);
    if (!currentTicket) return;
    
    const currentProcess = processes.find(p => p.id === currentTicket.process_id);
    const currentStage = currentProcess?.stages.find(s => s.id === currentTicket.current_stage_id);
    const targetStage = processes.find(p => p.stages.some(s => s.id === toStageId))?.stages.find(s => s.id === toStageId);
    
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            current_stage_id: toStageId,
            updated_at: new Date().toISOString(),
            activities: [
              ...(ticket.activities || []),
              {
                id: Date.now().toString(),
                ticket_id: ticketId,
                user_id: '1',
                user_name: 'أحمد محمد',
                type: 'stage_changed',
                description: `تم نقل التذكرة من مرحلة "${currentStage?.name || 'غير معروف'}" إلى مرحلة "${targetStage?.name || toStageId}"`,
                created_at: new Date().toISOString(),
                old_value: currentStage?.name,
                new_value: targetStage?.name,
                field_name: 'المرحلة'
              }
            ]
          }
        : ticket
    ));
  };

  const deleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
  };

  const createProcess = (processData: Partial<Process>) => {
    const newProcess: Process = {
      id: Date.now().toString(),
      name: processData.name || '',
      description: processData.description || '',
      color: processData.color || 'bg-blue-500',
      icon: processData.icon || 'FolderOpen',
      stages: processData.stages || [],
      fields: processData.fields || [],
      created_by: '1',
      created_at: new Date().toISOString(),
      is_active: true,
      settings: processData.settings || {
        auto_assign: false,
        due_date_required: false,
        allow_self_assignment: true,
        default_priority: 'medium',
        notification_settings: {
          email_notifications: true,
          in_app_notifications: true,
          notify_on_assignment: true,
          notify_on_stage_change: true,
          notify_on_due_date: true,
          notify_on_overdue: true
        }
      }
    };

    setProcesses(prev => [...prev, newProcess]);
  };

  const updateProcess = async (processId: string, updates: Partial<Process>): Promise<boolean> => {
    try {
      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        console.error('❌ رمز الوصول مطلوب للتحديث');
        return false;
      }

      console.log('📝 تحديث العملية:', processId, updates);

      // إرسال طلب PUT إلى API
      const response = await fetch(`http://localhost:3000/api/processes/${processId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      console.log('🚀 استجابة HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('🚀 محتوى الاستجابة:', result);

      if (response.ok && result.success === true) {
        console.log('✅ تم تحديث العملية بنجاح:', result);

        // تحديث العملية في الحالة المحلية
        setProcesses(prev => prev.map(process =>
          process.id === processId ? { ...process, ...result.data } : process
        ));

        return true;
      } else {
        console.error('❌ فشل في تحديث العملية:', result);
        return false;
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث العملية:', error);
      return false;
    }
  };

  const deleteProcess = async (processId: string): Promise<boolean> => {
    try {
      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        console.error('❌ رمز الوصول مطلوب للحذف');
        return false;
      }

      console.log('🗑️ حذف العملية:', processId);

      // إرسال طلب DELETE إلى API
      const response = await fetch(`http://localhost:3000/api/processes/${processId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🚀 استجابة HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('🚀 محتوى الاستجابة:', result);

      if (response.ok && result.success === true) {
        console.log('✅ تم حذف العملية بنجاح:', result);

        // حذف العملية من الحالة المحلية
        setProcesses(prev => prev.filter(process => process.id !== processId));

        // حذف التذاكر المرتبطة بالعملية
        setTickets(prev => prev.filter(ticket => ticket.process_id !== processId));

        return true;
      } else {
        console.error('❌ فشل في حذف العملية:', result);
        return false;
      }

    } catch (error) {
      console.error('❌ خطأ في حذف العملية:', error);
      return false;
    }
  };

  const getProcessUsers = (processId: string): User[] => {
    // إرجاع المستخدمين المخصصين لكل عملية
    const processUsersMap: Record<string, User[]> = {
      '1': [ // المشتريات
        {
          id: 'user-1',
          name: 'أحمد المالي',
          email: 'ahmed.finance@company.com',
          role: { id: 'finance-manager', name: 'مدير المالية', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-2',
          name: 'فاطمة المشتريات',
          email: 'fatima.purchasing@company.com',
          role: { id: 'purchasing-manager', name: 'مدير المشتريات', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-3',
          name: 'محمد المراجع',
          email: 'mohammed.reviewer@company.com',
          role: { id: 'senior-reviewer', name: 'مراجع أول', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      '2': [ // التوظيف
        {
          id: 'user-4',
          name: 'سارة الموارد البشرية',
          email: 'sara.hr@company.com',
          role: { id: 'hr-manager', name: 'مدير الموارد البشرية', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-5',
          name: 'خالد التوظيف',
          email: 'khalid.recruitment@company.com',
          role: { id: 'recruitment-specialist', name: 'أخصائي توظيف', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-6',
          name: 'نورا المقابلات',
          email: 'nora.interviews@company.com',
          role: { id: 'interview-coordinator', name: 'منسق المقابلات', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      '3': [ // الشكاوى
        {
          id: 'user-7',
          name: 'علي خدمة العملاء',
          email: 'ali.customerservice@company.com',
          role: { id: 'customer-service-manager', name: 'مدير خدمة العملاء', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-8',
          name: 'ليلى الجودة',
          email: 'layla.quality@company.com',
          role: { id: 'quality-manager', name: 'مدير الجودة', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      '4': [ // المشاريع
        {
          id: 'user-9',
          name: 'يوسف المشاريع',
          email: 'youssef.projects@company.com',
          role: { id: 'project-manager', name: 'مدير المشاريع', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-10',
          name: 'رنا التطوير',
          email: 'rana.development@company.com',
          role: { id: 'tech-lead', name: 'قائد تقني', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      '5': [ // الصيانة
        {
          id: 'user-11',
          name: 'عبدالله الصيانة',
          email: 'abdullah.maintenance@company.com',
          role: { id: 'maintenance-manager', name: 'مدير الصيانة', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'user-12',
          name: 'هند التقنية',
          email: 'hind.technical@company.com',
          role: { id: 'technical-specialist', name: 'أخصائي تقني', permissions: [] },
          avatar: '',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
    };

    return processUsersMap[processId] || [];
  };

  // إضافة حقل جديد إلى عملية محددة
  const addFieldToProcess = (processId: string, newField: ProcessField) => {
    console.log('🔄 إضافة حقل جديد إلى العملية:', processId, newField);
    console.log('📋 العملية المختارة الحالية:', selectedProcess);
    console.log('📋 عدد الحقول الحالي:', selectedProcess?.fields?.length || 0);

    // تحديث قائمة العمليات في الحالة العامة
    setProcesses(prevProcesses => {
      const updatedProcesses = prevProcesses.map(process =>
        process.id === processId
          ? { ...process, fields: [...process.fields, newField] }
          : process
      );
      console.log('📋 تم تحديث قائمة العمليات');
      return updatedProcesses;
    });

    // تحديث العملية المختارة إذا كانت هي نفس العملية
    setSelectedProcess(prevSelected => {
      if (prevSelected && prevSelected.id === processId) {
        const updatedSelected = { ...prevSelected, fields: [...prevSelected.fields, newField] };
        console.log('📋 تم تحديث العملية المختارة:', updatedSelected);
        console.log('📋 عدد الحقول الجديد:', updatedSelected.fields.length);
        return updatedSelected;
      }
      console.log('📋 لم يتم تحديث العملية المختارة - العملية غير متطابقة');
      return prevSelected;
    });

    console.log('✅ تم تحديث الحقول في الحالة المحلية');
  };

  // حذف حقل من عملية محددة
  const removeFieldFromProcess = (processId: string, fieldId: string) => {
    console.log('🗑️ حذف حقل من العملية:', processId, fieldId);
    console.log('📋 العملية المختارة الحالية:', selectedProcess);
    console.log('📋 عدد الحقول الحالي:', selectedProcess?.fields?.length || 0);

    // تحديث قائمة العمليات في الحالة العامة
    setProcesses(prevProcesses => {
      const updatedProcesses = prevProcesses.map(process =>
        process.id === processId
          ? { ...process, fields: process.fields.filter(field => field.id !== fieldId) }
          : process
      );
      console.log('📋 تم تحديث قائمة العمليات - حذف الحقل');
      return updatedProcesses;
    });

    // تحديث العملية المختارة إذا كانت هي نفس العملية
    setSelectedProcess(prevSelected => {
      if (prevSelected && prevSelected.id === processId) {
        const updatedSelected = {
          ...prevSelected,
          fields: prevSelected.fields.filter(field => field.id !== fieldId)
        };
        console.log('📋 تم تحديث العملية المختارة - حذف الحقل:', updatedSelected);
        console.log('📋 عدد الحقول الجديد:', updatedSelected.fields.length);
        return updatedSelected;
      }
      console.log('📋 لم يتم تحديث العملية المختارة - العملية غير متطابقة');
      return prevSelected;
    });

    console.log('✅ تم حذف الحقل من الحالة المحلية');
  };

  // إضافة مرحلة جديدة إلى عملية محددة
  const addStageToProcess = (processId: string, newStage: Stage) => {
    console.log('🔄 إضافة مرحلة جديدة إلى العملية:', processId, newStage);
    console.log('📋 العملية المختارة الحالية:', selectedProcess);
    console.log('📋 عدد المراحل الحالي:', selectedProcess?.stages?.length || 0);

    // تحديث قائمة العمليات في الحالة العامة
    setProcesses(prevProcesses => {
      const updatedProcesses = prevProcesses.map(process =>
        process.id === processId
          ? { ...process, stages: [...process.stages, newStage] }
          : process
      );
      console.log('📋 تم تحديث قائمة العمليات - إضافة المرحلة');
      return updatedProcesses;
    });

    // تحديث العملية المختارة إذا كانت هي نفس العملية
    setSelectedProcess(prevSelected => {
      if (prevSelected && prevSelected.id === processId) {
        const updatedSelected = { ...prevSelected, stages: [...prevSelected.stages, newStage] };
        console.log('📋 تم تحديث العملية المختارة - إضافة المرحلة:', updatedSelected);
        console.log('📋 عدد المراحل الجديد:', updatedSelected.stages.length);
        return updatedSelected;
      }
      console.log('📋 لم يتم تحديث العملية المختارة - العملية غير متطابقة');
      return prevSelected;
    });

    console.log('✅ تم إضافة المرحلة إلى الحالة المحلية');
  };

  // تحديث مرحلة في عملية محددة
  const updateStageInProcess = (processId: string, updatedStage: Stage) => {
    try {
      console.log('🔄 تحديث مرحلة في العملية:', processId, updatedStage);
      console.log('📋 العملية المختارة الحالية:', selectedProcess);
      console.log('📋 عدد المراحل الحالي:', selectedProcess?.stages?.length || 0);

      // التحقق من صحة البيانات
      if (!processId || !updatedStage || !updatedStage.id) {
        console.error('❌ بيانات غير صحيحة لتحديث المرحلة:', { processId, updatedStage });
        return;
      }

      // تحديث قائمة العمليات في الحالة العامة
      setProcesses(prevProcesses => {
        try {
          const updatedProcesses = prevProcesses.map(process =>
            process.id === processId
              ? {
                  ...process,
                  stages: process.stages?.map(stage =>
                    stage.id === updatedStage.id
                      ? {
                          ...stage,
                          ...updatedStage,
                          // التأكد من تضمين جميع الحقول المهمة
                          allowed_transitions: updatedStage.allowed_transitions || stage.allowed_transitions || [],
                          is_initial: updatedStage.is_initial !== undefined ? updatedStage.is_initial : stage.is_initial,
                          is_final: updatedStage.is_final !== undefined ? updatedStage.is_final : stage.is_final,
                          fields: updatedStage.fields || stage.fields || [],
                          transition_rules: updatedStage.transition_rules || stage.transition_rules || [],
                          automation_rules: updatedStage.automation_rules || stage.automation_rules || []
                        }
                      : stage
                  ) || []
                }
              : process
          );
          console.log('📋 تم تحديث قائمة العمليات - تحديث المرحلة');
          console.log('📋 المرحلة المحدثة:', updatedProcesses.find(p => p.id === processId)?.stages.find(s => s.id === updatedStage.id));
          return updatedProcesses;
        } catch (error) {
          console.error('❌ خطأ في تحديث قائمة العمليات:', error);
          return prevProcesses;
        }
      });

      // تحديث العملية المختارة إذا كانت هي نفس العملية
      setSelectedProcess(prevSelected => {
        try {
          if (prevSelected && prevSelected.id === processId) {
            const updatedSelected = {
              ...prevSelected,
              stages: prevSelected.stages?.map(stage =>
                stage.id === updatedStage.id
                  ? {
                      ...stage,
                      ...updatedStage,
                      // التأكد من تضمين جميع الحقول المهمة
                      allowed_transitions: updatedStage.allowed_transitions || stage.allowed_transitions || [],
                      is_initial: updatedStage.is_initial !== undefined ? updatedStage.is_initial : stage.is_initial,
                      is_final: updatedStage.is_final !== undefined ? updatedStage.is_final : stage.is_final,
                      fields: updatedStage.fields || stage.fields || [],
                      transition_rules: updatedStage.transition_rules || stage.transition_rules || [],
                      automation_rules: updatedStage.automation_rules || stage.automation_rules || []
                    }
                  : stage
              ) || []
            };
            console.log('📋 تم تحديث العملية المختارة - تحديث المرحلة:', updatedSelected);
            console.log('📋 عدد المراحل:', updatedSelected.stages.length);
            console.log('📋 المرحلة المحدثة في العملية المختارة:', updatedSelected.stages.find(s => s.id === updatedStage.id));
            return updatedSelected;
          }
          return prevSelected;
        } catch (error) {
          console.error('❌ خطأ في تحديث العملية المختارة:', error);
          return prevSelected;
        }
      });

      console.log('✅ تم تحديث المرحلة في الحالة المحلية');
    } catch (error) {
      console.error('❌ خطأ عام في تحديث المرحلة:', error);
    }
  };

  // حذف مرحلة من عملية محددة
  const removeStageFromProcess = (processId: string, stageId: string) => {
    console.log('🗑️ حذف مرحلة من العملية:', processId, stageId);
    console.log('📋 العملية المختارة الحالية:', selectedProcess);
    console.log('📋 عدد المراحل الحالي:', selectedProcess?.stages?.length || 0);

    // تحديث قائمة العمليات في الحالة العامة
    setProcesses(prevProcesses => {
      const updatedProcesses = prevProcesses.map(process =>
        process.id === processId
          ? { ...process, stages: process.stages.filter(stage => stage.id !== stageId) }
          : process
      );
      console.log('📋 تم تحديث قائمة العمليات - حذف المرحلة');
      return updatedProcesses;
    });

    // تحديث العملية المختارة إذا كانت هي نفس العملية
    setSelectedProcess(prevSelected => {
      if (prevSelected && prevSelected.id === processId) {
        const updatedSelected = {
          ...prevSelected,
          stages: prevSelected.stages.filter(stage => stage.id !== stageId)
        };
        console.log('📋 تم تحديث العملية المختارة - حذف المرحلة:', updatedSelected);
        console.log('📋 عدد المراحل الجديد:', updatedSelected.stages.length);
        return updatedSelected;
      }
      console.log('📋 لم يتم تحديث العملية المختارة - العملية غير متطابقة');
      return prevSelected;
    });

    console.log('✅ تم حذف المرحلة من الحالة المحلية');
  };

  const value = {
    processes,
    tickets,
    selectedProcess,
    setSelectedProcess,
    createTicket,
    updateTicket,
    moveTicket,
    deleteTicket,
    loading,
    createProcess,
    updateProcess,
    deleteProcess,
    getProcessUsers,
    addFieldToProcess,
    removeFieldFromProcess,
    addStageToProcess,
    updateStageInProcess,
    removeStageFromProcess
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};