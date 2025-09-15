import React, { useState } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { Process, Stage, ProcessField, FieldType } from '../../types/workflow';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Settings, 
  Palette, 
  Layers,
  FileText,
  ArrowRight,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

export const ProcessManager: React.FC = () => {
  const { processes, createProcess, updateProcess, deleteProcess } = useWorkflow();
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingField, setEditingField] = useState<ProcessField | null>(null);

  const [processForm, setProcessForm] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
    icon: 'FolderOpen'
  });

  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    color: 'bg-gray-500',
    order: 1,
    priority: 1,
    allowed_transitions: [] as string[],
    is_initial: false,
    is_final: false,
    sla_hours: undefined as number | undefined
  });

  const [fieldForm, setFieldForm] = useState({
    name: '',
    type: 'text' as FieldType,
    is_required: false,
    options: [] as { label: string; value: string }[]
  });

  const colorOptions = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
  ];

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'نص' },
    { value: 'number', label: 'رقم' },
    { value: 'email', label: 'بريد إلكتروني' },
    { value: 'phone', label: 'هاتف' },
    { value: 'date', label: 'تاريخ' },
    { value: 'datetime', label: 'تاريخ ووقت' },
    { value: 'select', label: 'قائمة منسدلة' },
    { value: 'multiselect', label: 'اختيار متعدد' },
    { value: 'textarea', label: 'نص طويل' },
    { value: 'checkbox', label: 'مربع اختيار' },
    { value: 'radio', label: 'اختيار واحد' },
    { value: 'file', label: 'ملف' },
    { value: 'ticket_reviewer', label: 'مراجع التذكرة' }
  ];

  const handleCreateProcess = () => {
    const newProcess: Partial<Process> = {
      ...processForm,
      stages: [
        {
          id: '1',
          name: 'جديد',
          color: 'bg-gray-500',
          order: 1,
          fields: [],
          transition_rules: [],
          automation_rules: []
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

    createProcess(newProcess);
    setIsCreating(false);
    setProcessForm({ name: '', description: '', color: 'bg-blue-500', icon: 'FolderOpen' });
  };

  const handleAddStage = () => {
    if (!selectedProcess) return;

    const newStage: Stage = {
      id: Date.now().toString(),
      ...stageForm,
      order: selectedProcess.stages.length + 1,
      fields: [],
      transition_rules: [],
      automation_rules: []
    };

    const updatedProcess = {
      ...selectedProcess,
      stages: [...selectedProcess.stages, newStage]
    };

    updateProcess(selectedProcess.id, updatedProcess);
    setSelectedProcess(updatedProcess);
    setStageForm({ 
      name: '', 
      description: '', 
      color: 'bg-gray-500', 
      order: 1, 
      priority: selectedProcess.stages.length + 1,
      allowed_transitions: [],
      is_initial: false,
      is_final: false,
      sla_hours: undefined
    });
  };

  const handleAddField = () => {
    if (!selectedProcess) return;

    const newField: ProcessField = {
      id: Date.now().toString(),
      ...fieldForm,
      is_system_field: false,
      options: fieldForm.type === 'select' || fieldForm.type === 'multiselect' || fieldForm.type === 'radio' 
        ? fieldForm.options.map((opt, idx) => ({ id: idx.toString(), ...opt, color: 'bg-gray-100' }))
        : undefined
    };

    const updatedProcess = {
      ...selectedProcess,
      fields: [...selectedProcess.fields, newField]
    };

    updateProcess(selectedProcess.id, updatedProcess);
    setSelectedProcess(updatedProcess);
    setFieldForm({ name: '', type: 'text', is_required: false, options: [] });
  };

  const handleDeleteStage = (stageId: string) => {
    if (!selectedProcess) return;

    const updatedProcess = {
      ...selectedProcess,
      stages: selectedProcess.stages.filter(stage => stage.id !== stageId)
    };

    updateProcess(selectedProcess.id, updatedProcess);
    setSelectedProcess(updatedProcess);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedProcess) return;

    const updatedProcess = {
      ...selectedProcess,
      fields: selectedProcess.fields.filter(field => field.id !== fieldId)
    };

    updateProcess(selectedProcess.id, updatedProcess);
    setSelectedProcess(updatedProcess);
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة العمليات</h1>
            <p className="text-gray-600">إنشاء وتعديل العمليات والمراحل والحقول</p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>عملية جديدة</span>
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)] overflow-hidden">
        {/* Process List */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">العمليات ({processes.length})</h3>
            
            <div className="space-y-2">
              {processes.map((process) => (
                <div
                  key={process.id}
                  onClick={() => setSelectedProcess(process)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all duration-200
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
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{process.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{process.description}</p>
                      <div className="flex items-center space-x-4 space-x-reverse mt-2 text-xs text-gray-400">
                        <span>{process.stages.length} مرحلة</span>
                        <span>{process.fields.length} حقل</span>
                        <span className={process.is_active ? 'text-green-600' : 'text-red-600'}>
                          {process.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedProcess ? (
            <div className="p-6">
              {/* Process Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-12 h-12 ${selectedProcess.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{selectedProcess.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedProcess.name}</h2>
                      <p className="text-gray-600">{selectedProcess.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => deleteProcess(selectedProcess.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">{selectedProcess.stages.length}</div>
                    <div className="text-sm text-gray-500">المراحل</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">{selectedProcess.fields.length}</div>
                    <div className="text-sm text-gray-500">الحقول</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className={`text-2xl font-bold ${selectedProcess.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProcess.is_active ? 'نشط' : 'معطل'}
                    </div>
                    <div className="text-sm text-gray-500">الحالة</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {/* يمكن إضافة عدد التذاكر هنا لاحقاً */}
                      --
                    </div>
                    <div className="text-sm text-gray-500">التذاكر</div>
                  </div>
                </div>
              </div>

              {/* Stages Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                    <Layers className="w-5 h-5" />
                    <span>المراحل ({selectedProcess.stages.length})</span>
                  </h3>
                  
                  <button
                    onClick={() => setEditingStage({ id: '', name: '', color: 'bg-gray-500', order: selectedProcess.stages.length + 1, fields: [], transition_rules: [], automation_rules: [] })}
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 space-x-reverse text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة مرحلة</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedProcess.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center space-x-4 space-x-reverse p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse flex-1">
                        <div className="text-gray-400 font-medium">{index + 1}</div>
                        <div className={`w-4 h-4 ${stage.color} rounded`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{stage.name}</div>
                          {stage.description && (
                            <div className="text-sm text-gray-500">{stage.description}</div>
                          )}
                        </div>
                      </div>
                      
                      {index < selectedProcess.stages.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => setEditingStage(stage)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        {selectedProcess.stages.length > 1 && (
                            <>
                              <div className="text-gray-400 font-medium">#{stage.priority}</div>
                              <button
                                onClick={() => handleDeleteStage(stage.id)}
                                className="p-1 rounded hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                        )}
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                          {stage.is_initial && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">أولى</span>
                          )}
                          {stage.is_final && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">نهائية</span>
                          )}
                          {stage.allowed_transitions && stage.allowed_transitions.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {stage.allowed_transitions.length} انتقال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fields Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                    <FileText className="w-5 h-5" />
                    <span>الحقول المخصصة ({selectedProcess.fields.length})</span>
                  </h3>
                  
                  <button
                    onClick={() => setEditingField({ id: '', name: '', type: 'text', is_required: false, is_system_field: false })}
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 space-x-reverse text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة حقل</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedProcess.fields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="font-medium text-gray-900">{field.name}</div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {fieldTypes.find(t => t.value === field.type)?.label}
                        </span>
                        {field.is_required && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">إجباري</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => setEditingField(field)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {selectedProcess.fields.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3" />
                      <p>لا توجد حقول مخصصة</p>
                      <p className="text-sm">أضف حقول لجمع بيانات إضافية</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">اختر عملية للتعديل</h3>
                <p className="text-gray-500">حدد عملية من القائمة لعرض تفاصيلها وتعديلها</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Process Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">عملية جديدة</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العملية</label>
                <input
                  type="text"
                  value={processForm.name}
                  onChange={(e) => setProcessForm({ ...processForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: المشتريات"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={processForm.description}
                  onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف مختصر للعملية..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللون</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setProcessForm({ ...processForm, color })}
                      className={`w-8 h-8 ${color} rounded-lg border-2 ${
                        processForm.color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateProcess}
                disabled={!processForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStage.id ? 'تعديل المرحلة' : 'مرحلة جديدة'}
              </h3>
              <button
                onClick={() => setEditingStage(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المرحلة</label>
                <input
                  type="text"
                  value={stageForm.name}
                  onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: مراجعة"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={stageForm.description}
                  onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف المرحلة..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                  <input
                    type="number"
                    min="1"
                    value={stageForm.priority}
                    onChange={(e) => setStageForm({ ...stageForm, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SLA (ساعات)</label>
                  <input
                    type="number"
                    min="1"
                    value={stageForm.sla_hours || ''}
                    onChange={(e) => setStageForm({ ...stageForm, sla_hours: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اختياري"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللون</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setStageForm({ ...stageForm, color })}
                      className={`w-8 h-8 ${color} rounded-lg border-2 ${
                        stageForm.color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Stage Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">نوع المرحلة</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stageForm.is_initial}
                      onChange={(e) => setStageForm({ ...stageForm, is_initial: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">مرحلة أولى (نقطة البداية)</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stageForm.is_final}
                      onChange={(e) => setStageForm({ ...stageForm, is_final: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">مرحلة نهائية (نقطة الانتهاء)</span>
                  </label>
                </div>
              </div>
              
              {/* Allowed Transitions */}
              {selectedProcess && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المراحل المسموحة للانتقال إليها
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedProcess.stages
                      .filter(s => s.id !== editingStage?.id)
                      .map((stage) => (
                      <label key={stage.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={stageForm.allowed_transitions.includes(stage.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStageForm({
                                ...stageForm,
                                allowed_transitions: [...stageForm.allowed_transitions, stage.id]
                              });
                            } else {
                              setStageForm({
                                ...stageForm,
                                allowed_transitions: stageForm.allowed_transitions.filter(id => id !== stage.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <div className="flex items-center space-x-2 space-x-reverse mr-2">
                          <div className={`w-3 h-3 ${stage.color} rounded`}></div>
                          <span className="text-sm text-gray-700">{stage.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingStage(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddStage}
                disabled={!stageForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingStage.id ? 'حفظ' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingField.id ? 'تعديل الحقل' : 'حقل جديد'}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الحقل</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: المبلغ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الحقل</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as FieldType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={fieldForm.is_required}
                  onChange={(e) => setFieldForm({ ...fieldForm, is_required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="required" className="mr-2 text-sm text-gray-700">
                  حقل إجباري
                </label>
              </div>

              {(fieldForm.type === 'select' || fieldForm.type === 'multiselect' || fieldForm.type === 'radio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الخيارات</label>
                  <div className="space-y-2">
                    {fieldForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...fieldForm.options];
                            newOptions[index] = { ...option, label: e.target.value, value: e.target.value };
                            setFieldForm({ ...fieldForm, options: newOptions });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="نص الخيار"
                        />
                        <button
                          onClick={() => {
                            const newOptions = fieldForm.options.filter((_, i) => i !== index);
                            setFieldForm({ ...fieldForm, options: newOptions });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setFieldForm({
                          ...fieldForm,
                          options: [...fieldForm.options, { label: '', value: '' }]
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 space-x-reverse text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة خيار</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddField}
                disabled={!fieldForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingField.id ? 'حفظ' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};