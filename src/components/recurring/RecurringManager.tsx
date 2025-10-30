import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { RecurringRule, RecurringSchedule, Process } from '../../types/workflow';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import { useQuickNotifications } from '../ui/NotificationSystem';
import { 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Play, 
  Pause,
  Calendar,
  Clock,
  Settings,
  FileText,
  Flag,
  Tag,
  User
} from 'lucide-react';

interface ProcessField {
  id: string;
  name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  is_system_field: boolean;
  default_value: any;
  options: any;
  validation_rules: any;
  order_index: number;
  group_name?: string;
  width?: string;
  help_text?: string;
  placeholder?: string;
}

interface ProcessStage {
  id: string;
  name: string;
  description: string;
  color: string;
  order_index: number;
  is_initial: boolean;
  is_final: boolean;
}

interface ProcessDetails {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  stages: ProcessStage[];
  fields: ProcessField[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const RecurringManager: React.FC = () => {
  const { processes } = useWorkflow();
  const notifications = useQuickNotifications();
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [selectedProcessDetails, setSelectedProcessDetails] = useState<ProcessDetails | null>(null);
  const [loadingProcessDetails, setLoadingProcessDetails] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    process_id: '',
    template_data: {
      title: '',
      description: '',
      priority: 'medium' as const,
      due_date: '',
      assigned_to: '',
      stage_id: '',
      ticket_type: 'task' as 'task' | 'bug' | 'feature' | 'support',
      data: {} as Record<string, any>
    },
    schedule: {
      type: 'daily' as const,
      interval: 1,
      time: '09:00',
      days_of_week: [],
      day_of_month: 1
    },
    is_active: true
  });

  const scheduleTypes = [
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'yearly', label: 'سنوي' },
    { value: 'custom', label: 'مخصص' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'الأحد' },
    { value: 1, label: 'الاثنين' },
    { value: 2, label: 'الثلاثاء' },
    { value: 3, label: 'الأربعاء' },
    { value: 4, label: 'الخميس' },
    { value: 5, label: 'الجمعة' },
    { value: 6, label: 'السبت' }
  ];

  // جلب تفاصيل العملية المختارة
  const fetchProcessDetails = async (processId: string) => {
    setLoadingProcessDetails(true);
    try {
      const data = await apiRequest(API_ENDPOINTS.PROCESSES.GET_BY_ID(processId));
      if (data.success && data.data) {
        setSelectedProcessDetails(data.data);
        
        // اختيار المرحلة الأولية كافتراضي
        const initialStage = data.data.stages?.find((stage: ProcessStage) => stage.is_initial && !stage.is_final);
        if (initialStage) {
          setRuleForm(prev => ({
            ...prev,
            template_data: {
              ...prev.template_data,
              stage_id: initialStage.id
            }
          }));
        }
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل العملية:', error);
    } finally {
      setLoadingProcessDetails(false);
    }
  };

  // جلب المستخدمين من API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiRequest(API_ENDPOINTS.USERS.LIST);
      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // جلب قواعد التكرار للعملية المحددة
  const fetchRecurringRules = async (processId: string) => {
    setLoadingRules(true);
    try {
      // استخدام نفس المعاملات من المثال المقدم
      const url = `${API_ENDPOINTS.RECURRING.RULES}?page=1&limit=50&process_id=${processId}`;
      const data = await apiRequest(url);
      
      if (data.success && data.data) {
        setRecurringRules(data.data);
      } else if (data.data && Array.isArray(data.data)) {
        // في حالة عدم وجود success flag
        setRecurringRules(data.data);
      } else {
        setRecurringRules([]);
      }
    } catch (error) {
      console.error('خطأ في جلب قواعد التكرار:', error);
      setRecurringRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  // معالجة اختيار العملية
  const handleProcessSelect = (process: Process) => {
    setSelectedProcess(process);
    fetchProcessDetails(process.id);
    fetchRecurringRules(process.id); // جلب قواعد التكرار للعملية المحددة
  };

  // معالجة تغيير قيم الحقول المخصصة
  const handleFieldChange = (fieldName: string, value: any) => {
    setRuleForm({
      ...ruleForm,
      template_data: {
        ...ruleForm.template_data,
        data: {
          ...ruleForm.template_data.data,
          [fieldName]: value
        }
      }
    });
  };

  // جلب المستخدمين عند فتح فورم الإنشاء
  useEffect(() => {
    if (isCreating) {
      fetchUsers();
    }
  }, [isCreating]);

  const handleCreateRule = () => {
    if (!selectedProcess || !ruleForm.name || !ruleForm.template_data.title) return;

    const newRule: RecurringRule = {
      id: Date.now().toString(),
      name: ruleForm.name,
      process_id: selectedProcess.id,
      template_data: {
        ...ruleForm.template_data,
        // تأكد من وجود process_id في template_data
        process_id: selectedProcess.id
      },
      schedule: ruleForm.schedule,
      is_active: ruleForm.is_active,
      created_by: '1',
      created_at: new Date().toISOString(),
      next_execution: calculateNextExecution(ruleForm.schedule)
    };

    setRecurringRules([...recurringRules, newRule]);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setRuleForm({
      name: '',
      process_id: '',
      template_data: {
        title: '',
        description: '',
        priority: 'medium' as const,
        due_date: '',
        assigned_to: '',
        stage_id: '',
        ticket_type: 'task' as 'task' | 'bug' | 'feature' | 'support',
        data: {}
      },
      schedule: {
        type: 'daily' as const,
        interval: 1,
        time: '09:00',
        days_of_week: [],
        day_of_month: 1
      },
      is_active: true
    });
    setSelectedProcessDetails(null);
  };

  const calculateNextExecution = (schedule: RecurringSchedule): string => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextExecution = new Date();
    nextExecution.setHours(hours, minutes, 0, 0);
    
    switch (schedule.type) {
      case 'daily':
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + schedule.interval);
        }
        break;
      case 'weekly':
        // Logic for weekly scheduling
        nextExecution.setDate(nextExecution.getDate() + 7 * schedule.interval);
        break;
      case 'monthly':
        nextExecution.setMonth(nextExecution.getMonth() + schedule.interval);
        if (schedule.day_of_month) {
          nextExecution.setDate(schedule.day_of_month);
        }
        break;
      case 'yearly':
        nextExecution.setFullYear(nextExecution.getFullYear() + schedule.interval);
        break;
    }
    
    return nextExecution.toISOString();
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRecurringRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, is_active: !rule.is_active } : rule
      )
    );
  };

  // حذف قاعدة التكرار
  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    try {
      // تأكيد الحذف باستخدام نظام الرسائل الموحد
      const confirmed = await notifications.confirmDelete(ruleName, 'قاعدة التكرار');
      
      if (!confirmed) {
        return;
      }

      // استدعاء API للحذف
      const response = await fetch(API_ENDPOINTS.RECURRING.DELETE_RULE(ruleId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // إزالة القاعدة من القائمة المحلية
        setRecurringRules(rules => rules.filter(rule => rule.id !== ruleId));
        
        // إظهار رسالة نجاح
        notifications.showSuccess(
          'تم الحذف بنجاح',
          `تم حذف قاعدة التكرار "${ruleName}" بنجاح`
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حذف قاعدة التكرار');
      }
    } catch (error) {
      console.error('خطأ في حذف قاعدة التكرار:', error);
      notifications.showError(
        'خطأ في الحذف',
        `فشل في حذف قاعدة التكرار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      );
    }
  };

  const getScheduleDescription = (rule: any): string => {
    // استخدام البيانات الفعلية من API
    if (!rule) {
      return 'جدول غير محدد';
    }

    const type = rule.recurrence_type;
    const interval = rule.recurrence_interval || 1;
    
    switch (type) {
      case 'daily':
        return `كل ${interval} يوم`;
      case 'weekly':
        return `كل ${interval} أسبوع`;
      case 'monthly':
        return `كل ${interval} شهر`;
      case 'yearly':
        return `كل ${interval} سنة`;
      default:
        return type ? `نوع: ${type}` : 'جدول غير محدد';
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 space-x-reverse">
              <RefreshCw className="w-8 h-8 text-blue-500" />
              <span>التذاكر المتكررة</span>
            </h1>
            <p className="text-gray-600">إنشاء تذاكر تلقائية حسب جدول محدد</p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>قاعدة تكرار جديدة</span>
          </button>
        </div>
      </div>

      <div className="p-6 h-[calc(100vh-140px)] flex gap-6">
        {/* Process Selector - Left Side */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">اختر العملية</h3>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
              {processes.length} عملية
            </span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {processes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عمليات</h3>
                <p className="text-gray-500">يجب إنشاء عملية أولاً لإنشاء قواعد التكرار</p>
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                {processes.map((process) => (
                <button
                  key={process.id}
                  onClick={() => handleProcessSelect(process)}
                  className={`
                    w-full p-4 rounded-lg border-2 transition-all duration-200 text-right
                    ${selectedProcess?.id === process.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-8 h-8 ${process.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{process.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="font-medium text-gray-900">{process.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{process.description}</p>
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rules Section - Right Side */}
        <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
          {!selectedProcess ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">اختر عملية للبدء</h3>
                <p className="text-gray-500">حدد عملية من القائمة لعرض وإدارة قواعد التكرار الخاصة بها</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <h3 className="text-lg font-semibold text-gray-900">
                    قواعد التكرار - {selectedProcess.name}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {recurringRules.filter(r => r.process_id === selectedProcess.id).length} قاعدة
                  </span>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 space-x-reverse"
                >
                  <Plus className="w-4 h-4" />
                  <span>قاعدة جديدة</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {loadingRules ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    <span className="text-gray-600">جاري تحميل قواعد التكرار...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                {recurringRules
                  .filter(rule => rule.process_id === selectedProcess.id)
                  .map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          rule.is_active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <RefreshCw className={`w-4 h-4 ${
                            rule.is_active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{(rule as any).rule_name || rule.name || 'قاعدة بدون اسم'}</h4>
                          <p className="text-sm text-gray-500">
                            {getScheduleDescription(rule)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {(rule as any).rule_description || (rule as any).description || 'لا يوجد وصف'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => toggleRuleStatus(rule.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {rule.is_active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRule(rule.id, (rule as any).rule_name || rule.name || 'قاعدة بدون اسم')}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">عنوان التذكرة:</span><br />
                        <span className="text-gray-800">{(rule as any).title || 'غير محدد'}</span>
                      </div>
                      <div>
                        <span className="font-medium">الأولوية:</span><br />
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          (rule as any).priority === 'high' ? 'bg-red-100 text-red-800' :
                          (rule as any).priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {(rule as any).priority === 'high' ? 'عالية' :
                           (rule as any).priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">عدد التنفيذات:</span><br />
                        <span className="text-gray-800">{(rule as any).execution_count || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium">الحالة:</span><br />
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.is_active ? 'نشط' : 'متوقف'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <span className="font-medium">التنفيذ التالي:</span><br />
                        <span className="text-gray-800">
                          {(rule as any).next_execution_date 
                            ? new Date((rule as any).next_execution_date).toLocaleString('ar', {
                                calendar: 'gregory',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'غير محدد'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">آخر تنفيذ:</span><br />
                        <span className="text-gray-800">
                          {(rule as any).last_execution_date 
                            ? new Date((rule as any).last_execution_date).toLocaleString('ar', {
                                calendar: 'gregory',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'لم يتم التنفيذ بعد'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-3">
                      <div>
                        <span className="font-medium">تاريخ البداية:</span><br />
                        <span className="text-gray-800">
                          {(rule as any).start_date 
                            ? new Date((rule as any).start_date).toLocaleDateString('ar', {
                                calendar: 'gregory',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })
                            : 'غير محدد'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">تاريخ النهاية:</span><br />
                        <span className="text-gray-800">
                          {(rule as any).end_date 
                            ? new Date((rule as any).end_date).toLocaleDateString('ar', {
                                calendar: 'gregory',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })
                            : 'مستمر'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">اسم العملية:</span><br />
                        <span className="text-gray-800">
                          {(rule as any).process_name || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                    
                    {((rule as any).assigned_to_name || (rule as any).created_by_name) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                        {(rule as any).assigned_to_name && (
                          <div>
                            <span className="font-medium">مُسند إلى:</span><br />
                            <span className="text-gray-800">{(rule as any).assigned_to_name}</span>
                          </div>
                        )}
                        {(rule as any).created_by_name && (
                          <div>
                            <span className="font-medium">أُنشئ بواسطة:</span><br />
                            <span className="text-gray-800">{(rule as any).created_by_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {recurringRules.filter(r => r.process_id === selectedProcess.id).length === 0 && (
                  <div className="text-center py-12">
                    <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قواعد تكرار</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإنشاء قاعدة تكرار لإنشاء تذاكر تلقائية</p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      إنشاء قاعدة جديدة
                    </button>
                  </div>
                )}
                </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Rule Modal */}
      {(isCreating || editingRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {editingRule ? 'تعديل قاعدة التكرار' : 'قاعدة تكرار جديدة'}
                    </h3>
                    {selectedProcess && (
                      <p className="text-blue-100 text-sm">
                        عملية: {selectedProcess.name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingRule(null);
                  }}
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="p-6">
                {/* Form Content - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* العمود الأيمن */}
                  <div className="space-y-6">
                    {/* معلومات القاعدة */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 space-x-reverse mb-4">
                        <Settings className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">معلومات القاعدة</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          اسم القاعدة *
                        </label>
                        <input
                          type="text"
                          value={ruleForm.name}
                          onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="أدخل اسم واضح ومختصر للقاعدة..."
                        />
                      </div>
                    </div>

                    {/* معلومات أساسية للتذكرة */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 space-x-reverse mb-4">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">معلومات أساسية</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            عنوان التذكرة *
                          </label>
                          <input
                            type="text"
                            value={ruleForm.template_data.title}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              template_data: { ...ruleForm.template_data, title: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="أدخل عنوان واضح ومختصر للتذكرة..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            الوصف التفصيلي
                          </label>
                          <textarea
                            value={ruleForm.template_data.description}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              template_data: { ...ruleForm.template_data, description: e.target.value }
                            })}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="اشرح التفاصيل والمتطلبات بوضوح..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* إعدادات التذكرة */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 space-x-reverse mb-4">
                        <Settings className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-semibold text-gray-900">إعدادات التذكرة</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Flag className="w-4 h-4 inline ml-1" />
                            الأولوية
                          </label>
                          <select
                            value={ruleForm.template_data.priority}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              template_data: { ...ruleForm.template_data, priority: e.target.value as any }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="low">منخفض</option>
                            <option value="medium">متوسط</option>
                            <option value="high">عاجل</option>
                            <option value="urgent">عاجل جداً</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline ml-1" />
                            تاريخ الاستحقاق
                          </label>
                          <input
                            type="datetime-local"
                            value={ruleForm.template_data.due_date || ''}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              template_data: { ...ruleForm.template_data, due_date: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                    

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline ml-1" />
                            المسند إليه
                          </label>
                          {loadingUsers ? (
                            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                              <span className="text-sm text-gray-500">جاري التحميل...</span>
                            </div>
                          ) : (
                            <select
                              value={ruleForm.template_data.assigned_to || ''}
                              onChange={(e) => setRuleForm({
                                ...ruleForm,
                                template_data: { ...ruleForm.template_data, assigned_to: e.target.value }
                              })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">اختر المستخدم</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* العمود الأيسر */}
                  <div className="space-y-6">
                    {/* المرحلة الأولية */}
                    {selectedProcessDetails && selectedProcessDetails.stages && selectedProcessDetails.stages.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-2 space-x-reverse mb-4">
                          <RefreshCw className="w-5 h-5 text-purple-500" />
                          <h3 className="text-lg font-semibold text-gray-900">المرحلة الأولية</h3>
                        </div>
                        {loadingProcessDetails ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-sm text-gray-600">جاري تحميل المراحل...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {selectedProcessDetails.stages
                              .filter(stage => !stage.is_final)
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((stage) => (
                                <button
                                  key={stage.id}
                                  type="button"
                                  onClick={() => setRuleForm({
                                    ...ruleForm,
                                    template_data: { ...ruleForm.template_data, stage_id: stage.id }
                                  })}
                                  className={`
                                    p-4 rounded-lg border-2 transition-all duration-200 text-right
                                    ${ruleForm.template_data.stage_id === stage.id
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                  `}
                                >
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                                    <span className="font-medium text-gray-900">{stage.name}</span>
                                    {stage.is_initial && (
                                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                                        افتراضي
                                      </span>
                                    )}
                                  </div>
                                  {stage.description && (
                                    <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                                  )}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* جدول التكرار */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 space-x-reverse mb-4">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-semibold text-gray-900">جدول التكرار</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">نوع التكرار</label>
                          <select
                            value={ruleForm.schedule.type}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              schedule: { ...ruleForm.schedule, type: e.target.value as any }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {scheduleTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">التكرار </label>
                          <input
                            type="number"
                            min="1"
                            value={ruleForm.schedule.interval}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              schedule: { ...ruleForm.schedule, interval: parseInt(e.target.value) }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline ml-1" />
                            تاريخ البداية
                          </label>
                          <input
                            type="datetime-local"
                            value={ruleForm.template_data.due_date || ''}
                            onChange={(e) => setRuleForm({
                              ...ruleForm,
                              template_data: { ...ruleForm.template_data, due_date: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {ruleForm.schedule.type === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">أيام الأسبوع</label>
                            <div className="flex flex-wrap gap-3">
                              {daysOfWeek.map((day) => (
                                <label key={day.value} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={ruleForm.schedule.days_of_week?.includes(day.value) || false}
                                    onChange={(e) => {
                                      const days = ruleForm.schedule.days_of_week || [];
                                      if (e.target.checked) {
                                        setRuleForm({
                                          ...ruleForm,
                                          schedule: {
                                            ...ruleForm.schedule,
                                            days_of_week: [...days, day.value]
                                          }
                                        });
                                      } else {
                                        setRuleForm({
                                          ...ruleForm,
                                          schedule: {
                                            ...ruleForm.schedule,
                                            days_of_week: days.filter(d => d !== day.value)
                                          }
                                        });
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                  />
                                  <span className="mr-2 text-sm text-gray-700">{day.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {ruleForm.schedule.type === 'monthly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">يوم الشهر</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={ruleForm.schedule.day_of_month}
                              onChange={(e) => setRuleForm({
                                ...ruleForm,
                                schedule: { ...ruleForm.schedule, day_of_month: parseInt(e.target.value) }
                              })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}

                        {/* تفعيل القاعدة */}
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="active"
                            checked={ruleForm.is_active}
                            onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <label htmlFor="active" className="mr-2 text-sm font-medium text-gray-700">
                            تفعيل القاعدة فور الإنشاء
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>




                {/* حقول العملية المخصصة - في العمودين */}
                {selectedProcessDetails && selectedProcessDetails.fields && selectedProcessDetails.fields.filter(field => !field.is_system_field).length > 0 && (
                  <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 space-x-reverse mb-6">
                      <div className={`w-6 h-6 ${selectedProcess?.color || 'bg-blue-500'} rounded mr-2`}></div>
                      <h3 className="text-lg font-semibold text-gray-900">حقول {selectedProcess?.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {selectedProcessDetails.fields
                        .filter(field => !field.is_system_field)
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((field) => (
                          <div key={field.id} className={
                            field.width === 'full' || field.width === '100%' || field.field_type === 'textarea' || field.field_type === 'multiselect' || field.field_type === 'radio'
                              ? 'md:col-span-2' 
                              : ''
                          }>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                              {field.is_required && <span className="text-red-500 mr-1">*</span>}
                            </label>
                            
                            {field.field_type === 'text' && (
                              <input
                                type="text"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || `أدخل ${field.label}...`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            )}
                            
                            {field.field_type === 'email' && (
                              <input
                                type="email"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || "example@domain.com"}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            )}
                            
                            {field.field_type === 'number' && (
                              <input
                                type="number"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || `أدخل ${field.label}...`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            )}
                            
                            {field.field_type === 'textarea' && (
                              <textarea
                                rows={3}
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || `أدخل ${field.label}...`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                            )}
                            
                            {field.field_type === 'phone' && (
                              <input
                                type="tel"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || "+966 50 123 4567"}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            )}

                            {field.field_type === 'date' && (
                              <input
                                type="date"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}

                            {field.field_type === 'datetime' && (
                              <input
                                type="datetime-local"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}

                            {field.field_type === 'select' && (field.options?.choices || field.options) && (
                              <select 
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر {field.label}</option>
                                {(field.options?.choices || field.options || []).map((choice: any, index: number) => (
                                  <option key={index} value={choice.value}>
                                    {choice.label}
                                  </option>
                                ))}
                              </select>
                            )}

                            {field.field_type === 'multiselect' && field.options && (
                              <div className="space-y-2">
                                {field.options.map((option: any, index: number) => (
                                  <label key={index} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        Array.isArray(ruleForm.template_data.data[field.name]) 
                                          ? ruleForm.template_data.data[field.name].includes(option.value)
                                          : false
                                      }
                                      onChange={(e) => {
                                        const currentValues = Array.isArray(ruleForm.template_data.data[field.name]) 
                                          ? ruleForm.template_data.data[field.name] 
                                          : [];
                                        
                                        if (e.target.checked) {
                                          handleFieldChange(field.name, [...currentValues, option.value]);
                                        } else {
                                          handleFieldChange(field.name, currentValues.filter((v: any) => v !== option.value));
                                        }
                                      }}
                                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="mr-2 text-sm text-gray-700">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {field.field_type === 'radio' && field.options && (
                              <div className="space-y-2">
                                {field.options.map((option: any, index: number) => (
                                  <label key={index} className="flex items-center">
                                    <input
                                      type="radio"
                                      name={field.name}
                                      value={option.value}
                                      checked={ruleForm.template_data.data[field.name] === option.value}
                                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                      className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="mr-2 text-sm text-gray-700">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {field.field_type === 'checkbox' && (
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={ruleForm.template_data.data[field.name] || false}
                                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="mr-2 text-sm text-gray-700">{field.help_text || field.label}</span>
                              </label>
                            )}

                            {field.field_type === 'url' && (
                              <input
                                type="url"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || `أدخل ${field.label}...`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            )}

                            {field.field_type === 'file' && (
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFieldChange(field.name, {
                                        name: file.name,
                                        size: file.size,
                                        type: file.type,
                                        url: URL.createObjectURL(file)
                                      });
                                    }
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {ruleForm.template_data.data[field.name] && (
                                  <div className="text-sm text-gray-600">
                                    ملف محدد: {ruleForm.template_data.data[field.name].name || ruleForm.template_data.data[field.name]}
                                  </div>
                                )}
                              </div>
                            )}

                            {field.field_type === 'ticket_reviewer' && (
                              <div className="space-y-2">
                                <select
                                  value={ruleForm.template_data.data[field.name] || ''}
                                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">اختر المراجع</option>
                                  {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name}
                                    </option>
                                  ))}
                                </select>
                                
                                {ruleForm.template_data.data[field.name] && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                          {users.find(u => u.id === ruleForm.template_data.data[field.name])?.name.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium text-blue-900">
                                          {users.find(u => u.id === ruleForm.template_data.data[field.name])?.name}
                                        </div>
                                        <div className="text-sm text-blue-700">
                                          {users.find(u => u.id === ruleForm.template_data.data[field.name])?.email}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {field.help_text && field.field_type !== 'checkbox' && (
                              <p className="mt-1 text-sm text-gray-500">{field.help_text}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* رسالة عدم وجود حقول مخصصة */}
                {selectedProcessDetails && selectedProcessDetails.fields && selectedProcessDetails.fields.filter(field => !field.is_system_field).length === 0 && (
                  <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 space-x-reverse mb-4">
                      <div className={`w-6 h-6 ${selectedProcess?.color || 'bg-blue-500'} rounded mr-2`}></div>
                      <h3 className="text-lg font-semibold text-gray-900">حقول {selectedProcess?.name}</h3>
                    </div>
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-gray-400 mb-2">
                        <Settings className="w-8 h-8 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-500">لا توجد حقول مخصصة لهذه العملية</p>
                      <p className="text-xs text-gray-400 mt-1">سيتم استخدام الحقول الأساسية فقط</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0">
              {/* Required Fields Notice */}
              {selectedProcessDetails?.fields?.some(field => field.is_required && !field.is_system_field) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-blue-500 mr-2">
                      <Settings className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">ملاحظة:</span> الحقول المميزة بـ 
                      <span className="text-red-500 mx-1">*</span> 
                      مطلوبة لإنشاء القاعدة
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  تأكد من ملء جميع الحقول المطلوبة قبل الحفظ
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingRule(null);
                    }}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 space-x-reverse"
                  >
                    <X className="w-4 h-4" />
                    <span>إلغاء</span>
                  </button>
                  <button
                    onClick={handleCreateRule}
                    disabled={
                      !ruleForm.name || 
                      !ruleForm.template_data.title ||
                      !selectedProcess ||
                      (selectedProcessDetails?.fields?.some(field => 
                        field.is_required && 
                        !field.is_system_field && 
                        (!ruleForm.template_data.data[field.name] || 
                         (Array.isArray(ruleForm.template_data.data[field.name]) && ruleForm.template_data.data[field.name].length === 0))
                      ))
                    }
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse transition-all duration-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingRule ? 'حفظ التغييرات' : 'إنشاء القاعدة'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringManager;