import React, { useState } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { AutomationRule, AutomationTrigger, AutomationAction, Process } from '../../types/workflow';
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Play, 
  Pause,
  Settings,
  Bell,
  Mail,
  ArrowRight,
  Clock,
  User,
  MessageSquare,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const AutomationManager: React.FC = () => {
  const { processes } = useWorkflow();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    trigger: {
      event: 'stage_changed' as const,
      stage_id: '',
      field_id: '',
      conditions: []
    },
    actions: [] as AutomationAction[],
    is_active: true
  });

  const triggerTypes = [
    { value: 'stage_changed', label: 'تغيير المرحلة', icon: ArrowRight },
    { value: 'field_updated', label: 'تحديث حقل', icon: Edit },
    { value: 'due_date_approaching', label: 'اقتراب الموعد', icon: Clock },
    { value: 'overdue', label: 'تأخير', icon: AlertTriangle },
    { value: 'created', label: 'إنشاء تذكرة', icon: Plus },
    { value: 'assigned', label: 'إسناد تذكرة', icon: User },
    { value: 'completed', label: 'إكمال تذكرة', icon: FileText }
  ];

  const actionTypes = [
    { value: 'send_notification', label: 'إرسال إشعار', icon: Bell },
    { value: 'send_email', label: 'إرسال بريد إلكتروني', icon: Mail },
    { value: 'move_to_stage', label: 'نقل إلى مرحلة', icon: ArrowRight },
    { value: 'update_field', label: 'تحديث حقل', icon: Edit },
    { value: 'create_ticket', label: 'إنشاء تذكرة', icon: Plus },
    { value: 'assign_user', label: 'إسناد مستخدم', icon: User },
    { value: 'add_comment', label: 'إضافة تعليق', icon: MessageSquare }
  ];

  const handleCreateRule = () => {
    if (!selectedProcess) return;

    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: ruleForm.name,
      trigger: ruleForm.trigger,
      actions: ruleForm.actions,
      is_active: ruleForm.is_active,
      conditions: ruleForm.trigger.conditions
    };

    setAutomationRules([...automationRules, newRule]);
    setIsCreating(false);
    setRuleForm({
      name: '',
      trigger: { event: 'stage_changed', stage_id: '', field_id: '', conditions: [] },
      actions: [],
      is_active: true
    });
  };

  const handleAddAction = () => {
    setRuleForm({
      ...ruleForm,
      actions: [
        ...ruleForm.actions,
        { type: 'send_notification', parameters: {} }
      ]
    });
  };

  const handleUpdateAction = (index: number, action: AutomationAction) => {
    const newActions = [...ruleForm.actions];
    newActions[index] = action;
    setRuleForm({ ...ruleForm, actions: newActions });
  };

  const handleRemoveAction = (index: number) => {
    setRuleForm({
      ...ruleForm,
      actions: ruleForm.actions.filter((_, i) => i !== index)
    });
  };

  const toggleRuleStatus = (ruleId: string) => {
    setAutomationRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, is_active: !rule.is_active } : rule
      )
    );
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 space-x-reverse">
              <Zap className="w-8 h-8 text-yellow-500" />
              <span>الأتمتة والقواعد الذكية</span>
            </h1>
            <p className="text-gray-600">أتمتة المهام وتحسين سير العمل</p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>قاعدة جديدة</span>
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
          <>
            {/* Automation Rules */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  قواعد الأتمتة - {selectedProcess.name}
                </h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {automationRules.length} قاعدة
                </span>
              </div>

              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          rule.is_active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Zap className={`w-4 h-4 ${
                            rule.is_active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-500">
                            {triggerTypes.find(t => t.value === rule.trigger.event)?.label}
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
                    
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                      <span>الإجراءات:</span>
                      {rule.actions.map((action, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {actionTypes.find(a => a.value === action.type)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                
                {automationRules.length === 0 && (
                  <div className="text-center py-12">
                    <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قواعد أتمتة</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإنشاء قاعدة أتمتة لتحسين سير العمل</p>
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

      {/* Create/Edit Rule Modal */}
      {(isCreating || editingRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRule ? 'تعديل قاعدة الأتمتة' : 'قاعدة أتمتة جديدة'}
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
                  placeholder="مثال: إشعار عند التأخير"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحفز</label>
                <select
                  value={ruleForm.trigger.event}
                  onChange={(e) => setRuleForm({
                    ...ruleForm,
                    trigger: { ...ruleForm.trigger, event: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {triggerTypes.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">الإجراءات</label>
                  <button
                    onClick={handleAddAction}
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 space-x-reverse text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة إجراء</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {ruleForm.actions.map((action, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <select
                          value={action.type}
                          onChange={(e) => handleUpdateAction(index, {
                            ...action,
                            type: e.target.value as any
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-2"
                        >
                          {actionTypes.map((actionType) => (
                            <option key={actionType.value} value={actionType.value}>
                              {actionType.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveAction(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Action Parameters */}
                      {action.type === 'send_notification' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="عنوان الإشعار"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <textarea
                            placeholder="نص الإشعار"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      
                      {action.type === 'move_to_stage' && selectedProcess && (
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="">اختر المرحلة</option>
                          {selectedProcess.stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {stage.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
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
                disabled={!ruleForm.name || ruleForm.actions.length === 0}
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