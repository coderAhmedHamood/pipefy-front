import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Upload, Calendar, User, Flag, Tag, FileText, AlertCircle, CheckCircle, Clock, Settings, Eye } from 'lucide-react';
import { Process, ProcessField, Priority, Ticket } from '../../types/workflow';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { getPriorityLabel } from '../../utils/priorityUtils';

interface CreateTicketModalProps {
  process: Process;
  stageId: string;
  onClose: () => void;
  onSave: (ticketData: Partial<Ticket>) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  process,
  stageId,
  onClose,
  onSave
}) => {
  const { getProcessUsers } = useWorkflow();
  const [formData, setFormData] = useState<Record<string, any>>({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    due_date: '',
    assigned_to: '',
    tags: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // إضافة console.log للتأكد من تمرير البيانات
  useEffect(() => {
    console.log('CreateTicketModal opened with:', { process: process.name, stageId });
  }, [process, stageId]);
  // تحديث البيانات عند تغيير الحقل
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // إزالة الخطأ عند التعديل
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // التحقق من العنوان
    if (!formData.title?.trim()) {
      newErrors.title = 'العنوان مطلوب';
    }

    // التحقق من الحقول المطلوبة
    process.fields.forEach(field => {
      if (field.is_required && !formData[field.id]) {
        newErrors[field.id] = `${field.name} مطلوب`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // حفظ التذكرة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // محاكاة تأخير الحفظ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ticketData: Partial<Ticket> = {
        title: formData.title,
        description: formData.description,
        process_id: process.id,
        current_stage_id: stageId,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        assigned_to: formData.assigned_to || undefined,
        data: Object.fromEntries(
          process.fields.map(field => [field.id, formData[field.id]])
        ),
        tags: formData.tags || []
      };

      onSave(ticketData);
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // رندر الحقول المختلفة
  const renderField = (field: ProcessField) => {
    const value = formData[field.id] || '';
    const hasError = !!errors[field.id];

    const baseInputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
            placeholder="example@domain.com"
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
            placeholder="+966 50 123 4567"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={3}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
          >
            <option value="">اختر {field.name}</option>
            {field.options?.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...currentValues, option.value]);
                    } else {
                      handleFieldChange(field.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="mr-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="mr-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="mr-2 text-sm text-gray-700">{field.name}</span>
          </label>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(field.id, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: URL.createObjectURL(file)
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {value && (
              <div className="text-sm text-gray-600">
                ملف محدد: {value.name}
              </div>
            )}
          </div>
        );

      case 'ticket_reviewer':
        const processUsers = getProcessUsers(process.id);
        return (
          <div className="space-y-2">
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">اختر المراجع</option>
              {processUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role.name}
                </option>
              ))}
            </select>
            
            {value && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {processUsers.find(u => u.id === value)?.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">
                      {processUsers.find(u => u.id === value)?.name}
                    </div>
                    <div className="text-sm text-blue-700">
                      {processUsers.find(u => u.id === value)?.role.name}
                    </div>
                    <div className="text-xs text-blue-600">
                      {processUsers.find(u => u.id === value)?.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );
    }
  };

  const currentStage = process.stages.find(s => s.id === stageId);

  // إضافة console.log للتأكد من العثور على المرحلة
  useEffect(() => {
    console.log('Current stage found:', currentStage);
  }, [currentStage]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">{process.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">تذكرة جديدة</h1>
              <p className="text-blue-100">{process.name} - {currentStage?.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(95vh-120px)]">
          <div className="flex flex-1 min-h-0">
            {/* Left Panel - Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* العنوان الأساسي */}
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
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="أدخل عنوان واضح ومختصر للتذكرة..."
                    />
                    {errors.title && (
                      <div className="flex items-center space-x-1 space-x-reverse mt-1 text-red-500 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوصف التفصيلي
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="اشرح التفاصيل والمتطلبات بوضوح..."
                    />
                  </div>
                </div>
              </div>

              {/* الحقول الأساسية */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <Settings className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">إعدادات التذكرة</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Flag className="w-4 h-4 inline ml-1" />
                      الأولوية
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}
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
                      value={formData.due_date}
                      onChange={(e) => handleFieldChange('due_date', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

            {/* الحقول المخصصة للعملية */}
            {process.fields.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <div className={`w-6 h-6 ${process.color} rounded mr-2`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">حقول {process.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {process.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.name}
                        {field.is_required && <span className="text-red-500 mr-1">*</span>}
                      </label>
                      
                      {renderField(field)}
                      
                      {errors[field.id] && (
                        <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* Right Panel - Preview & Actions */}
            <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
              {/* Preview */}
              <div className="p-6 bg-white border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span>معاينة التذكرة</span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">العنوان:</span>
                    <span className="font-medium text-gray-900">{formData.title || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">العملية:</span>
                    <span className="font-medium text-gray-900">{process.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المرحلة:</span>
                    <span className="font-medium text-gray-900">{currentStage?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الأولوية:</span>
                    <span className={`font-medium ${
                      formData.priority === 'urgent' ? 'text-red-600' :
                      formData.priority === 'high' ? 'text-orange-600' :
                      formData.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPriorityLabel(formData.priority)}
                    </span>
                  </div>
                  {formData.due_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">موعد الإنتهاء:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(formData.due_date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Progress */}
              <div className="p-6 bg-white border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">مراحل العملية</h3>
                <div className="space-y-3">
                  {process.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index === 0 ? <CheckCircle className="w-3 h-3" /> : index + 1}
                      </div>
                      <span className={`text-sm ${index === 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {stage.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="p-6 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>إنشاء التذكرة</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};