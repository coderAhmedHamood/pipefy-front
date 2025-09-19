import { Process } from '../types/workflow';
import { ApiResponse, PaginatedResponse } from '../lib/api';
import { ProcessListParams, ProcessStats } from './processService';

// بيانات تجريبية للعمليات
const mockProcesses: Process[] = [
  {
    id: '1',
    name: 'طلبات المشتريات',
    description: 'إدارة طلبات المشتريات والموافقات',
    color: 'bg-blue-500',
    icon: 'ShoppingCart',
    created_by: 'user1',
    created_at: '2024-01-15T10:00:00Z',
    is_active: true,
    stages: [
      {
        id: 'stage1',
        name: 'طلب جديد',
        color: 'bg-gray-500',
        order: 1,
        priority: 1,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: ['stage2'],
        is_initial: true,
        is_final: false
      },
      {
        id: 'stage2',
        name: 'مراجعة المدير',
        color: 'bg-yellow-500',
        order: 2,
        priority: 2,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: ['stage3', 'stage4'],
        is_initial: false,
        is_final: false
      },
      {
        id: 'stage3',
        name: 'موافق',
        color: 'bg-green-500',
        order: 3,
        priority: 3,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: [],
        is_initial: false,
        is_final: true
      },
      {
        id: 'stage4',
        name: 'مرفوض',
        color: 'bg-red-500',
        order: 4,
        priority: 4,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: [],
        is_initial: false,
        is_final: true
      }
    ],
    fields: [
      {
        id: 'field1',
        name: 'المبلغ المطلوب',
        type: 'number',
        is_required: true,
        is_system_field: false
      },
      {
        id: 'field2',
        name: 'سبب الطلب',
        type: 'textarea',
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
    name: 'طلبات الإجازات',
    description: 'إدارة طلبات الإجازات والموافقات',
    color: 'bg-green-500',
    icon: 'Calendar',
    created_by: 'user1',
    created_at: '2024-01-10T09:00:00Z',
    is_active: true,
    stages: [
      {
        id: 'stage1',
        name: 'طلب جديد',
        color: 'bg-gray-500',
        order: 1,
        priority: 1,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: ['stage2'],
        is_initial: true,
        is_final: false
      },
      {
        id: 'stage2',
        name: 'موافق',
        color: 'bg-green-500',
        order: 2,
        priority: 2,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: [],
        is_initial: false,
        is_final: true
      }
    ],
    fields: [
      {
        id: 'field1',
        name: 'تاريخ البداية',
        type: 'date',
        is_required: true,
        is_system_field: false
      },
      {
        id: 'field2',
        name: 'تاريخ النهاية',
        type: 'date',
        is_required: true,
        is_system_field: false
      },
      {
        id: 'field3',
        name: 'نوع الإجازة',
        type: 'select',
        is_required: true,
        is_system_field: false,
        options: [
          { id: '1', label: 'إجازة سنوية', value: 'annual', color: 'bg-blue-100' },
          { id: '2', label: 'إجازة مرضية', value: 'sick', color: 'bg-red-100' },
          { id: '3', label: 'إجازة طارئة', value: 'emergency', color: 'bg-yellow-100' }
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
    name: 'طلبات الصيانة',
    description: 'إدارة طلبات الصيانة والإصلاحات',
    color: 'bg-orange-500',
    icon: 'Wrench',
    created_by: 'user2',
    created_at: '2024-01-05T14:30:00Z',
    is_active: false,
    stages: [
      {
        id: 'stage1',
        name: 'طلب جديد',
        color: 'bg-gray-500',
        order: 1,
        priority: 1,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: ['stage2'],
        is_initial: true,
        is_final: false
      },
      {
        id: 'stage2',
        name: 'قيد التنفيذ',
        color: 'bg-blue-500',
        order: 2,
        priority: 2,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: ['stage3'],
        is_initial: false,
        is_final: false
      },
      {
        id: 'stage3',
        name: 'مكتمل',
        color: 'bg-green-500',
        order: 3,
        priority: 3,
        fields: [],
        transition_rules: [],
        automation_rules: [],
        allowed_transitions: [],
        is_initial: false,
        is_final: true
      }
    ],
    fields: [
      {
        id: 'field1',
        name: 'نوع المشكلة',
        type: 'select',
        is_required: true,
        is_system_field: false,
        options: [
          { id: '1', label: 'كهرباء', value: 'electrical', color: 'bg-yellow-100' },
          { id: '2', label: 'سباكة', value: 'plumbing', color: 'bg-blue-100' },
          { id: '3', label: 'تكييف', value: 'hvac', color: 'bg-green-100' }
        ]
      },
      {
        id: 'field2',
        name: 'وصف المشكلة',
        type: 'textarea',
        is_required: true,
        is_system_field: false
      },
      {
        id: 'field3',
        name: 'الأولوية',
        type: 'select',
        is_required: true,
        is_system_field: false,
        options: [
          { id: '1', label: 'عادية', value: 'normal', color: 'bg-gray-100' },
          { id: '2', label: 'عاجلة', value: 'urgent', color: 'bg-red-100' }
        ]
      }
    ],
    settings: {
      auto_assign: false,
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
  }
];

const mockStats: ProcessStats = {
  total_processes: 3,
  active_processes: 2,
  inactive_processes: 1,
  total_tickets: 45
};

// محاكاة تأخير الشبكة
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockProcessService {
  async getProcesses(params?: ProcessListParams): Promise<PaginatedResponse<Process>> {
    await delay(800); // محاكاة تأخير الشبكة

    let filteredProcesses = [...mockProcesses];

    // تطبيق المرشحات
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredProcesses = filteredProcesses.filter(process =>
        process.name.toLowerCase().includes(searchLower) ||
        process.description.toLowerCase().includes(searchLower)
      );
    }

    if (params?.is_active !== undefined) {
      filteredProcesses = filteredProcesses.filter(process => process.is_active === params.is_active);
    }

    // ترتيب النتائج
    if (params?.sort_by) {
      filteredProcesses.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (params.sort_by) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          default:
            return 0;
        }

        if (params.sort_order === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }

    // تطبيق التصفح
    const page = params?.page || 1;
    const perPage = params?.per_page || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedProcesses = filteredProcesses.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedProcesses,
      message: 'تم جلب العمليات بنجاح',
      pagination: {
        page,
        per_page: perPage,
        total: filteredProcesses.length,
        total_pages: Math.ceil(filteredProcesses.length / perPage)
      }
    };
  }

  async getProcessStats(): Promise<ApiResponse<ProcessStats>> {
    await delay(500);

    return {
      success: true,
      data: mockStats,
      message: 'تم جلب الإحصائيات بنجاح'
    };
  }

  async searchProcesses(query: string): Promise<ApiResponse<Process[]>> {
    await delay(600);

    const searchLower = query.toLowerCase();
    const results = mockProcesses.filter(process =>
      process.name.toLowerCase().includes(searchLower) ||
      process.description.toLowerCase().includes(searchLower)
    );

    return {
      success: true,
      data: results,
      message: `تم العثور على ${results.length} نتيجة`
    };
  }

  async createProcess(processData: Partial<Process>): Promise<ApiResponse<Process>> {
    await delay(1000); // محاكاة تأخير أطول للإنشاء

    // التحقق من البيانات المطلوبة
    if (!processData.name || !processData.description) {
      return {
        success: false,
        message: 'اسم العملية والوصف مطلوبان'
      };
    }

    // التحقق من عدم تكرار الاسم
    const existingProcess = mockProcesses.find(p => p.name === processData.name);
    if (existingProcess) {
      return {
        success: false,
        message: 'يوجد عملية بنفس الاسم بالفعل'
      };
    }

    // إنشاء العملية الجديدة
    const newProcess: Process = {
      id: `process_${Date.now()}`,
      name: processData.name,
      description: processData.description,
      color: processData.color || 'bg-blue-500',
      icon: processData.icon || 'FolderOpen',
      created_by: 'current_user',
      created_at: new Date().toISOString(),
      is_active: true,
      stages: [
        {
          id: `stage_${Date.now()}`,
          name: 'جديد',
          color: 'bg-gray-500',
          order: 1,
          priority: 1,
          fields: [],
          transition_rules: [],
          automation_rules: [],
          allowed_transitions: [],
          is_initial: true,
          is_final: false
        }
      ],
      fields: [],
      settings: {
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

    // إضافة العملية للقائمة
    mockProcesses.push(newProcess);

    // تحديث الإحصائيات
    mockStats.total_processes++;
    mockStats.active_processes++;

    return {
      success: true,
      data: newProcess,
      message: 'تم إنشاء العملية بنجاح'
    };
  }
}

export const mockProcessService = new MockProcessService();
export default mockProcessService;
