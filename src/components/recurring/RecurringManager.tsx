import React, { useState } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { RecurringRule, RecurringSchedule, Process } from '../../types/workflow';
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

export const RecurringManager: React.FC = () => {
  const { processes } = useWorkflow();
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    process_id: '',
    template_data: {
      title: '',
      description: '',
      priority: 'medium' as const,
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

  const handleCreateRule = () => {
    if (!selectedProcess) return;

    const newRule: RecurringRule = {
      id: Date.now().toString(),
      name: ruleForm.name,
      process_id: selectedProcess.id,
      template_data: ruleForm.template_data,
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
        priority: 'medium',
        data: {}
      },
      schedule: {
        type: 'daily',
        interval: 1,
        time: '09:00',
        days_of_week: [],
        day_of_month: 1
      },
      is_active: true
    });
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

      <div className="p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* Process Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">اختر العملية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processes.map((process) => (
              <button
                key={process.id}
                onClick={() => setSelectedProcess(process)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-right
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
                  <div>
                    <h4 className="font-medium text-gray-900">{process.name}</h4>
                    <p className="text-sm text-gray-500">{process.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedProcess && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                قواعد التكرار - {selectedProcess.name}
              </h3>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {recurringRules.filter(r => r.process_id === selectedProcess.id).length} قاعدة
              </span>
            </div>

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
        )}
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
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
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
                disabled={!ruleForm.name || !ruleForm.template_data.title}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRule ? 'حفظ التغييرات' : 'إنشاء القاعدة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};