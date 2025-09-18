import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Process } from '../../types/workflow';

interface CreateProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (processData: Partial<Process>) => Promise<boolean>;
  loading?: boolean;
}

interface ProcessFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

const colorOptions = [
  { value: 'bg-blue-500', label: 'أزرق', preview: 'bg-blue-500' },
  { value: 'bg-green-500', label: 'أخضر', preview: 'bg-green-500' },
  { value: 'bg-purple-500', label: 'بنفسجي', preview: 'bg-purple-500' },
  { value: 'bg-red-500', label: 'أحمر', preview: 'bg-red-500' },
  { value: 'bg-yellow-500', label: 'أصفر', preview: 'bg-yellow-500' },
  { value: 'bg-indigo-500', label: 'نيلي', preview: 'bg-indigo-500' },
  { value: 'bg-pink-500', label: 'وردي', preview: 'bg-pink-500' },
  { value: 'bg-teal-500', label: 'تركوازي', preview: 'bg-teal-500' },
  { value: 'bg-orange-500', label: 'برتقالي', preview: 'bg-orange-500' },
  { value: 'bg-cyan-500', label: 'سماوي', preview: 'bg-cyan-500' },
  { value: 'bg-lime-500', label: 'ليموني', preview: 'bg-lime-500' },
  { value: 'bg-rose-500', label: 'وردي داكن', preview: 'bg-rose-500' }
];

const iconOptions = [
  { value: 'FolderOpen', label: 'مجلد' },
  { value: 'ShoppingCart', label: 'عربة تسوق' },
  { value: 'Calendar', label: 'تقويم' },
  { value: 'Wrench', label: 'مفتاح ربط' },
  { value: 'Users', label: 'مستخدمين' },
  { value: 'FileText', label: 'ملف نصي' },
  { value: 'Settings', label: 'إعدادات' },
  { value: 'Briefcase', label: 'حقيبة' },
  { value: 'Truck', label: 'شاحنة' },
  { value: 'Home', label: 'منزل' }
];

export const CreateProcessModal: React.FC<CreateProcessModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<ProcessFormData>({
    name: '',
    description: '',
    color: 'bg-blue-500',
    icon: 'FolderOpen'
  });

  const [errors, setErrors] = useState<Partial<ProcessFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProcessFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم العملية مطلوب';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'اسم العملية يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف العملية مطلوب';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'وصف العملية يجب أن يكون 10 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon
      });

      if (success) {
        // إعادة تعيين النموذج
        setFormData({
          name: '',
          description: '',
          color: 'bg-blue-500',
          icon: 'FolderOpen'
        });
        setErrors({});
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        color: 'bg-blue-500',
        icon: 'FolderOpen'
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">إنشاء عملية جديدة</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Process Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم العملية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="مثال: طلبات المشتريات"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Process Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف العملية <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="وصف مختصر للعملية وهدفها..."
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Process Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اللون</label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 ${color.preview} rounded-lg border-2 transition-all ${
                    formData.color === color.value 
                      ? 'border-gray-900 scale-110' 
                      : 'border-transparent hover:border-gray-400'
                  }`}
                  title={color.label}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          {/* Process Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الأيقونة</label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              {iconOptions.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">معاينة</label>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`w-10 h-10 ${formData.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">
                  {formData.name.charAt(0) || 'ع'}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formData.name || 'اسم العملية'}
                </div>
                <div className="text-sm text-gray-500">
                  {formData.description || 'وصف العملية'}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>إنشاء العملية</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProcessModal;
