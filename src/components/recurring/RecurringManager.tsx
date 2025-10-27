import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { RecurringRule, RecurringSchedule, Process } from '../../types/workflow';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
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
  Repeat,
  Settings
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
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [selectedProcessDetails, setSelectedProcessDetails] = useState<ProcessDetails | null>(null);
  const [loadingProcessDetails, setLoadingProcessDetails] = useState(false);
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

  // معالجة اختيار العملية
  const handleProcessSelect = (process: Process) => {
    setSelectedProcess(process);
    fetchProcessDetails(process.id);
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

  const getScheduleDescription = (schedule: RecurringSchedule): string => {
    switch (schedule.type) {
      case 'daily':
        return `كل ${schedule.interval} يوم في ${schedule.time}`;
      case 'weekly':
        return `كل ${schedule.interval} أسبوع في ${schedule.time}`;
      case 'monthly':
        return `كل ${schedule.interval} شهر في اليوم ${schedule.day_of_month} في ${schedule.time}`;
      case 'yearly':
        return `كل ${schedule.interval} سنة في ${schedule.time}`;
      default:
        return 'جدول مخصص';
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
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-500">
                            {getScheduleDescription(rule.schedule)}
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
                        <button className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">القالب:</span> {rule.template_data.title}
                      </div>
                      <div>
                        <span className="font-medium">التنفيذ التالي:</span>{' '}
                        {new Date(rule.next_execution).toLocaleDateString('ar-SA')}
                      </div>
                      <div>
                        <span className="font-medium">آخر تنفيذ:</span>{' '}
                        {rule.last_executed 
                          ? new Date(rule.last_executed).toLocaleDateString('ar-SA')
                          : 'لم يتم التنفيذ بعد'
                        }
                      </div>
                    </div>
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
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Rule Modal */}
      {(isCreating || editingRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRule ? 'تعديل قاعدة التكرار' : 'قاعدة تكرار جديدة'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingRule(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم القاعدة</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: تقرير شهري"
                />
              </div>

              {/* Template Data */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">قالب التذكرة</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={ruleForm.template_data.title}
                    onChange={(e) => setRuleForm({
                      ...ruleForm,
                      template_data: { ...ruleForm.template_data, title: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="عنوان التذكرة المتكررة"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={ruleForm.template_data.description}
                    onChange={(e) => setRuleForm({
                      ...ruleForm,
                      template_data: { ...ruleForm.template_data, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وصف التذكرة المتكررة"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                    <select
                      value={ruleForm.template_data.priority}
                      onChange={(e) => setRuleForm({
                        ...ruleForm,
                        template_data: { ...ruleForm.template_data, priority: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">منخفض</option>
                      <option value="medium">متوسط</option>
                      <option value="high">عاجل</option>
                      <option value="urgent">عاجل جداً</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع التذكرة</label>
                    <select
                      value={ruleForm.template_data.ticket_type || 'task'}
                      onChange={(e) => setRuleForm({
                        ...ruleForm,
                        template_data: { ...ruleForm.template_data, ticket_type: e.target.value as 'task' | 'bug' | 'feature' | 'support' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="task">مهمة</option>
                      <option value="bug">خطأ</option>
                      <option value="feature">ميزة</option>
                      <option value="support">دعم</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={ruleForm.template_data.due_date || ''}
                      onChange={(e) => setRuleForm({
                        ...ruleForm,
                        template_data: { ...ruleForm.template_data, due_date: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المسند إليه</label>
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-600">جاري تحميل المستخدمين...</span>
                      </div>
                    ) : (
                      <select
                        value={ruleForm.template_data.assigned_to || ''}
                        onChange={(e) => setRuleForm({
                          ...ruleForm,
                          template_data: { ...ruleForm.template_data, assigned_to: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">اختر المستخدم</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Process Stages */}
                {selectedProcessDetails && selectedProcessDetails.stages && selectedProcessDetails.stages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المرحلة الأولية</label>
                    {loadingProcessDetails ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-600">جاري تحميل المراحل...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedProcessDetails.stages
                          .filter(stage => !stage.is_final) // استبعاد المراحل النهائية
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
                                p-3 rounded-lg border-2 transition-all duration-200 text-right
                                ${ruleForm.template_data.stage_id === stage.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
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

                {/* Process Fields */}
                {selectedProcessDetails && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">حقول العملية المخصصة</h4>
                      {loadingProcessDetails && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                          <span className="text-sm text-gray-600">جاري التحميل...</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedProcessDetails.fields && selectedProcessDetails.fields.filter(field => !field.is_system_field).length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2">
                          <Settings className="w-8 h-8 mx-auto" />
                        </div>
                        <p className="text-sm text-gray-500">لا توجد حقول مخصصة لهذه العملية</p>
                        <p className="text-xs text-gray-400 mt-1">سيتم استخدام الحقول الأساسية فقط</p>
                      </div>
                    ) : selectedProcessDetails.fields && selectedProcessDetails.fields.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProcessDetails.fields
                        .filter(field => !field.is_system_field)
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((field) => (
                          <div key={field.id} className={
                            field.width === 'full' || field.width === '100%' || field.field_type === 'textarea' || field.field_type === 'multiselect' 
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
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'email' && (
                              <input
                                type="email"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'number' && (
                              <input
                                type="number"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'textarea' && (
                              <textarea
                                rows={3}
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'select' && (field.options?.choices || field.options) && (
                              <select 
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر {field.label}</option>
                                {(field.options?.choices || field.options || []).map((choice: any, index: number) => (
                                  <option key={index} value={choice.value}>
                                    {choice.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            
                            {field.field_type === 'date' && (
                              <input
                                type="date"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'datetime' && (
                              <input
                                type="datetime-local"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'checkbox' && (
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={ruleForm.template_data.data[field.name] || false}
                                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="mr-2 text-sm text-gray-700">{field.help_text || field.label}</span>
                              </div>
                            )}
                            
                            {field.field_type === 'multiselect' && field.options && (
                              <div className="border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
                                <div className="text-sm text-gray-600 mb-2">اختر عدة خيارات:</div>
                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                  {field.options.map((option: any, index: number) => (
                                    <label key={index} className="flex items-center p-2 hover:bg-white rounded transition-colors cursor-pointer">
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
                                      <span className="mr-2 text-sm text-gray-700 font-medium">{option.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {field.field_type === 'radio' && field.options && (
                              <div className="border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
                                <div className="text-sm text-gray-600 mb-2">اختر خيار واحد:</div>
                                <div className="space-y-2">
                                  {field.options.map((option: any, index: number) => (
                                    <label key={index} className="flex items-center p-2 hover:bg-white rounded transition-colors cursor-pointer">
                                      <input
                                        type="radio"
                                        name={field.name}
                                        value={option.value}
                                        checked={ruleForm.template_data.data[field.name] === option.value}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                      />
                                      <span className="mr-2 text-sm text-gray-700 font-medium">{option.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {field.field_type === 'url' && (
                              <input
                                type="url"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'phone' && (
                              <input
                                type="tel"
                                value={ruleForm.template_data.data[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.field_type === 'file' && (
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFieldChange(field.name, file.name);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.help_text && field.field_type !== 'checkbox' && (
                              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">جدول التكرار</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع التكرار</label>
                    <select
                      value={ruleForm.schedule.type}
                      onChange={(e) => setRuleForm({
                        ...ruleForm,
                        schedule: { ...ruleForm.schedule, type: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {scheduleTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الفترة</label>
                    <input
                      type="number"
                      min="1"
                      value={ruleForm.schedule.interval}
                      onChange={(e) => setRuleForm({
                        ...ruleForm,
                        schedule: { ...ruleForm.schedule, interval: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوقت</label>
                  <input
                    type="time"
                    value={ruleForm.schedule.time}
                    onChange={(e) => setRuleForm({
                      ...ruleForm,
                      schedule: { ...ruleForm.schedule, time: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {ruleForm.schedule.type === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">أيام الأسبوع</label>
                    <div className="flex flex-wrap gap-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={ruleForm.is_active}
                  onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="active" className="mr-2 text-sm text-gray-700">
                  تفعيل القاعدة
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
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
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingRule(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-4 h-4" />
                <span>{editingRule ? 'حفظ التغييرات' : 'إنشاء القاعدة'}</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringManager;