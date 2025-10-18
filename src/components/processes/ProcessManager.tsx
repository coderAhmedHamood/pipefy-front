import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { Process, Stage, ProcessField, FieldType } from '../../types/workflow';
import { useToast, ToastContainer } from '../ui/Toast';
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
  EyeOff,
  FolderOpen,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Heart,
  Zap,
  Target
} from 'lucide-react';

export const ProcessManager: React.FC = () => {
  const { processes, createProcess, updateProcess, deleteProcess, addFieldToProcess, updateFieldInProcess, removeFieldFromProcess, addStageToProcess, updateStageInProcess, removeStageFromProcess, selectedProcess, setSelectedProcess } = useWorkflow();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingField, setEditingField] = useState<ProcessField | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [isDeletingField, setIsDeletingField] = useState<string | null>(null);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isDeletingStage, setIsDeletingStage] = useState<string | null>(null);

  const [processForm, setProcessForm] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
    icon: 'FolderOpen'
  });

  const [editForm, setEditForm] = useState({
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

  const iconOptions = [
    { value: 'FolderOpen', label: 'مجلد', icon: FolderOpen },
    { value: 'Settings', label: 'إعدادات', icon: Settings },
    { value: 'Users', label: 'مستخدمين', icon: Users },
    { value: 'FileText', label: 'ملف', icon: FileText },
    { value: 'Calendar', label: 'تقويم', icon: Calendar },
    { value: 'Clock', label: 'ساعة', icon: Clock },
    { value: 'CheckCircle', label: 'تحقق', icon: CheckCircle },
    { value: 'AlertCircle', label: 'تنبيه', icon: AlertCircle },
    { value: 'Star', label: 'نجمة', icon: Star },
    { value: 'Heart', label: 'قلب', icon: Heart },
    { value: 'Zap', label: 'برق', icon: Zap },
    { value: 'Target', label: 'هدف', icon: Target }
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

  // تحميل بيانات الحقل عند فتح نموذج التحديث
  React.useEffect(() => {
    if (editingField && editingField.id) {
      console.log('🔄 تحميل بيانات الحقل للتحديث:', editingField);
      console.log('🔍 جميع خصائص الحقل:', Object.keys(editingField));
      console.log('🔍 البيانات الكاملة:', JSON.stringify(editingField, null, 2));

      // استخراج جميع البيانات من الحقل
      const fieldData = editingField as any;

      // تجربة جميع الطرق الممكنة لاستخراج نوع الحقل
      console.log('🔍 field_type:', fieldData.field_type);
      console.log('🔍 type:', fieldData.type);
      console.log('🔍 fieldType:', fieldData.fieldType);

      // البيانات القادمة من API تستخدم field_type وليس type
      const fieldType = fieldData.field_type || fieldData.type || fieldData.fieldType || 'text';
      const fieldOptions = fieldData.options || [];

      console.log('📝 نوع الحقل المستخرج:', fieldType);
      console.log('📋 خيارات الحقل:', fieldOptions);
      console.log('✅ حالة الإجبارية:', fieldData.is_required);

      // تحميل بيانات الحقل الموجود للتحديث
      const formData = {
        name: fieldData.name || fieldData.label || '',
        type: fieldType,
        is_required: fieldData.is_required || false,
        options: fieldOptions.map((option: any) => ({
          label: option.label || '',
          value: option.value || ''
        }))
      };

      console.log('📋 بيانات النموذج النهائية:', formData);
      setFieldForm(formData);

      console.log('✅ تم تحميل بيانات الحقل بنجاح');
    } else if (editingField && !editingField.id) {
      // إعادة تعيين النموذج للحقل الجديد
      setFieldForm({
        name: '',
        type: 'text',
        is_required: false,
        options: []
      });
    }
  }, [editingField]);

  // مراقبة تغييرات fieldForm
  React.useEffect(() => {
    console.log('🔄 تغيير في fieldForm:', fieldForm);
  }, [fieldForm]);

  const handleCreateProcess = async () => {
    try {
      // إعداد بيانات العملية للإرسال إلى API
      const processData = {
        name: processForm.name,
        description: processForm.description || '',
        color: processForm.color || 'bg-blue-500',
        icon: processForm.icon || 'FolderOpen',
        create_default_stages: true, // إنشاء مراحل افتراضية
        settings: {
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
      };

      
      console.log("🚀 إرسال بيانات العملية إلى API:", processData);

      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');

      // إذا لم يوجد auth_token، جرب token
      if (!token) {
        token = localStorage.getItem('token');
      }

      console.log("🔑 Token المستخدم:", token ? `${token.substring(0, 20)}...` : 'غير موجود');

      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      // إرسال طلب POST إلى API
      const response = await fetch(`${API_BASE_URL}/api/processes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processData)
      });

      console.log("🚀 استجابة HTTP:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const result = await response.json();
      console.log("🚀 محتوى الاستجابة:", result);

      // تحقق من نجاح العملية بناءً على HTTP status و محتوى الاستجابة
      if (response.ok && result.success === true) {
        console.log("✅ تم إنشاء العملية بنجاح:", result);

        // استخدام البيانات المرجعة من API
        const processToAdd = result.data;

        // إضافة العملية الجديدة إلى الحالة المحلية
        createProcess(processToAdd);

        // إغلاق المودال وإعادة تعيين النموذج
        setIsCreating(false);
        setProcessForm({ name: '', description: '', color: 'bg-blue-500', icon: 'FolderOpen' });

        alert('تم إنشاء العملية بنجاح!');
      } else {
        console.error("❌ فشل في إنشاء العملية:", {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        alert(`فشل في إنشاء العملية: ${result?.message || response.statusText || 'خطأ غير معروف'}`);
      }

    } catch (error) {
      console.error("❌ خطأ في الاتصال بـ API:", error);
      alert('خطأ في الاتصال بالخادم. تأكد من أن الخادم يعمل.');
    }
  };

  // دالة حذف العملية
  const handleDeleteProcess = async (processId: string) => {
    try {
      // تأكيد الحذف من المستخدم
      const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه العملية؟ سيتم حذف جميع البيانات المرتبطة بها.');

      if (!confirmDelete) {
        return;
      }

      console.log('🗑️ بدء حذف العملية:', processId);

      // استدعاء دالة الحذف من Context
      const success = await deleteProcess(processId);

      if (success) {
        console.log('✅ تم حذف العملية بنجاح');
        alert('تم حذف العملية بنجاح!');

        // إغلاق تفاصيل العملية إذا كانت مفتوحة
        if (selectedProcess && selectedProcess.id === processId) {
          setSelectedProcess(null);
        }
      } else {
        console.error('❌ فشل في حذف العملية');
        alert('فشل في حذف العملية. يرجى المحاولة مرة أخرى.');
      }

    } catch (error) {
      console.error('❌ خطأ في حذف العملية:', error);
      alert(`خطأ في حذف العملية: ${error.message}`);
    }
  };

  // دالة بدء تحرير العملية
  const handleStartEdit = (process: Process) => {
    setEditForm({
      name: process.name,
      description: process.description || '',
      color: process.color || 'bg-blue-500',
      icon: process.icon || 'FolderOpen'
    });
    setIsEditing(true);
  };

  // دالة تحديث العملية
  const handleUpdateProcess = async () => {
    try {
      if (!selectedProcess) {
        alert('لم يتم اختيار عملية للتحديث');
        return;
      }

      // التحقق من صحة البيانات
      if (!editForm.name.trim()) {
        alert('اسم العملية مطلوب');
        return;
      }

      setIsUpdating(true);

      // إعداد بيانات التحديث
      const updateData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        color: editForm.color,
        icon: editForm.icon
      };

      console.log('📝 بدء تحديث العملية:', selectedProcess.id, updateData);

      // استدعاء دالة التحديث من Context
      const success = await updateProcess(selectedProcess.id, updateData);

      if (success) {
        console.log('✅ تم تحديث العملية بنجاح');
        alert('تم تحديث العملية بنجاح!');

        // إغلاق نموذج التحرير
        setIsEditing(false);

        // تحديث العملية المختارة في الحالة المحلية
        setSelectedProcess(prev => prev ? { ...prev, ...updateData } : null);
      } else {
        console.error('❌ فشل في تحديث العملية');
        alert('فشل في تحديث العملية. يرجى المحاولة مرة أخرى.');
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث العملية:', error);
      alert(`خطأ في تحديث العملية: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // دالة إلغاء التحرير
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: '',
      description: '',
      color: 'bg-blue-500',
      icon: 'FolderOpen'
    });
  };

  const handleAddStage = async () => {
    try {
      if (!selectedProcess) {
        alert('لم يتم اختيار عملية لإضافة المرحلة إليها');
        return;
      }

      // التحقق من صحة البيانات
      if (!stageForm.name.trim()) {
        alert('اسم المرحلة مطلوب');
        return;
      }

      setIsCreatingStage(true);

      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        console.error('❌ رمز الوصول مطلوب لإنشاء المرحلة');
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      // حساب الأولوية والترتيب التالي بناءً على القيم الموجودة
      const maxOrderIndex = selectedProcess.stages.length > 0
        ? Math.max(...selectedProcess.stages.map(s => s.order || 0))
        : 0;
      const maxPriority = selectedProcess.stages.length > 0
        ? Math.max(...selectedProcess.stages.map(s => s.priority || 0))
        : 0;

      // إعداد بيانات المرحلة للإرسال إلى API
      const stageData = {
        process_id: selectedProcess.id,
        name: stageForm.name.trim(),
        description: stageForm.description?.trim() || '',
        color: stageForm.color || '#6B7280',
        order_index: maxOrderIndex + 1,
        priority: maxPriority + 1,
        is_initial: stageForm.is_initial || false,
        is_final: stageForm.is_final || false,
        sla_hours: stageForm.sla_hours || null,
        allowed_transitions: stageForm.allowed_transitions || [],
        required_permissions: [],
        automation_rules: [],
        settings: {}
      };

      console.log('📝 إرسال بيانات المرحلة إلى API:', stageData);
      console.log('🔍 المراحل المسموحة المُرسلة:', stageData.allowed_transitions);

      // إرسال طلب POST إلى API
      const response = await fetch(`${API_BASE_URL}/api/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stageData)
      });

      console.log('🚀 استجابة HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('🚀 محتوى الاستجابة:', result);
      console.log('🔍 المراحل المسموحة المُستلمة:', result.data?.allowed_transitions);
      console.log('🔍 transitions المُستلمة:', result.data?.transitions);

      if (response.ok && result.success === true) {
        console.log('✅ تم إنشاء المرحلة بنجاح:', result);

        // تحويل البيانات من API إلى تنسيق الواجهة
        const newStage: Stage = {
          id: result.data.id,
          name: result.data.name,
          description: result.data.description,
          color: result.data.color,
          order: result.data.order_index,
          priority: result.data.priority,
          allowed_transitions: result.data.allowed_transitions || result.data.transitions?.map((t: any) => t.to_stage_id) || [],
          is_initial: result.data.is_initial,
          is_final: result.data.is_final,
          sla_hours: result.data.sla_hours,
          fields: [],
          transition_rules: [],
          automation_rules: []
        };

        // استخدام الدالة المحسنة لتحديث الحالة بكفاءة
        addStageToProcess(selectedProcess.id, newStage);

        // إغلاق المودال أولاً لتجنب مشاكل الـ re-rendering
        setEditingStage(null);

        // حساب الأولوية التالية بعد إضافة المرحلة الجديدة
        const newMaxPriority = selectedProcess.stages.length > 0
          ? Math.max(...selectedProcess.stages.map(s => s.priority || 0)) + 1
          : 1;

        // إعادة تعيين النموذج
        setStageForm({
          name: '',
          description: '',
          color: 'bg-gray-500',
          order: 1,
          priority: newMaxPriority + 1,
          allowed_transitions: [],
          is_initial: false,
          is_final: false,
          sla_hours: undefined
        });

        // عرض رسالة النجاح بعد إغلاق المودال
        setTimeout(() => {
          showSuccess('تم إنشاء المرحلة بنجاح!', 'تم إضافة المرحلة الجديدة إلى العملية');
        }, 100);
      } else {
        console.error('❌ فشل في إنشاء المرحلة:', result);
        showError('فشل في إنشاء المرحلة', result?.message || 'خطأ غير معروف');
      }

    } catch (error) {
      console.error('❌ خطأ في إنشاء المرحلة:', error);
      showError('خطأ في إنشاء المرحلة', error instanceof Error ? error.message : 'خطأ غير معروف');
    } finally {
      setIsCreatingStage(false);
    }
  };

  // تحديث مرحلة موجودة
  const handleUpdateStage = async () => {
    try {
      if (!selectedProcess || !editingStage || !editingStage.id) {
        alert('لا يمكن تحديث المرحلة - بيانات غير صحيحة');
        return;
      }

      // التحقق من صحة البيانات
      if (!stageForm.name.trim()) {
        alert('يرجى إدخال اسم المرحلة');
        return;
      }

      setIsUpdatingStage(true);
      console.log('🔄 بدء تحديث المرحلة:', editingStage.id);

      // إعداد بيانات المرحلة للتحديث
      const updateData = {
        name: stageForm.name.trim(),
        description: stageForm.description?.trim() || '',
        color: stageForm.color || '#6B7280',
        priority: stageForm.priority,
        is_initial: Boolean(stageForm.is_initial), // ✅ إصلاح: استخدام Boolean() بدلاً من || false
        is_final: Boolean(stageForm.is_final),     // ✅ إصلاح: استخدام Boolean() بدلاً من || false
        sla_hours: stageForm.sla_hours || null,
        allowed_transitions: stageForm.allowed_transitions || [],
        required_permissions: [],
        automation_rules: [],
        settings: {}
      };

      console.log('📝 إرسال بيانات تحديث المرحلة إلى API:', updateData);
      console.log('🔍 تفاصيل الحقول الحرجة:');
      console.log('  - is_initial:', updateData.is_initial, '(نوع:', typeof updateData.is_initial, ')');
      console.log('  - is_final:', updateData.is_final, '(نوع:', typeof updateData.is_final, ')');
      console.log('  - allowed_transitions:', updateData.allowed_transitions, '(عدد:', updateData.allowed_transitions.length, ')');

      // التحقق من وجود رمز المصادقة
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      // إرسال طلب التحديث إلى API
      const response = await fetch(`${API_BASE_URL}/api/stages/${editingStage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('🚀 استجابة HTTP:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 استجابة API:', result);
      console.log('📋 بيانات المرحلة المحدثة:', result.data);
      console.log('📋 allowed_transitions في الاستجابة:', result.data?.allowed_transitions);
      console.log('📋 is_initial في الاستجابة:', result.data?.is_initial);
      console.log('📋 is_final في الاستجابة:', result.data?.is_final);

      if (result.success) {
        console.log('✅ تم تحديث المرحلة بنجاح:', result.data);

        // إغلاق المودال أولاً لتجنب مشاكل الـ re-rendering
        setEditingStage(null);

        // إعادة تعيين النموذج
        setStageForm({
          name: '',
          description: '',
          color: 'bg-gray-500',
          order: 1,
          priority: 1,
          allowed_transitions: [],
          is_initial: false,
          is_final: false,
          sla_hours: undefined
        });

        // تحديث الحالة المحلية فوراً
        try {
          updateStageInProcess(selectedProcess.id, result.data);
          showSuccess('تم تحديث المرحلة بنجاح!', 'تم حفظ التغييرات في قاعدة البيانات');
        } catch (updateError) {
          console.error('❌ خطأ في تحديث الحالة المحلية:', updateError);
          showError('خطأ في تحديث الواجهة', 'تم تحديث المرحلة في قاعدة البيانات، لكن حدث خطأ في تحديث الواجهة. يرجى إعادة تحميل الصفحة.');
        }

      } else {
        console.error('❌ فشل في تحديث المرحلة:', result);
        showError('فشل في تحديث المرحلة', result?.message || 'خطأ غير معروف');
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث المرحلة:', error);

      // تحديد نوع الخطأ وعرض رسالة مناسبة
      let errorMessage = 'خطأ غير معروف';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'فشل في الاتصال بالخادم. تأكد من:\n' +
                        '• تشغيل الخادم الخلفي (node server.js)\n' +
                        '• الخادم يعمل على المنفذ 3003\n' +
                        '• لا توجد مشاكل في الشبكة';
        } else if (error.message.includes('401')) {
          errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى';
        } else if (error.message.includes('403')) {
          errorMessage = 'ليس لديك صلاحية لتحديث هذه المرحلة';
        } else if (error.message.includes('404')) {
          errorMessage = 'المرحلة غير موجودة أو تم حذفها';
        } else if (error.message.includes('500')) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else {
          errorMessage = error.message;
        }
      }

      showError('خطأ في تحديث المرحلة', errorMessage);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAddField = async () => {
    try {
      if (!selectedProcess) {
        alert('لم يتم اختيار عملية لإضافة الحقل إليها');
        return;
      }

      // التحقق من صحة البيانات
      if (!fieldForm.name.trim()) {
        alert('اسم الحقل مطلوب');
        return;
      }

      setIsCreatingField(true);

      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        console.error('❌ رمز الوصول مطلوب لإنشاء الحقل');
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      // إعداد بيانات الحقل للإرسال إلى API
      const fieldData = {
        process_id: selectedProcess.id,
        name: fieldForm.name.trim(),
        label: fieldForm.name.trim(), // استخدام الاسم كـ label افتراضياً
        field_type: fieldForm.type,
        is_required: fieldForm.is_required,
        is_system_field: false,
        is_searchable: true,
        is_filterable: true,
        options: fieldForm.type === 'select' || fieldForm.type === 'multiselect' || fieldForm.type === 'radio'
          ? fieldForm.options.filter(opt => opt.label && opt.value) // تصفية الخيارات الفارغة
          : [],
        validation_rules: [],
        width: 'full'
      };

      console.log('📝 إرسال بيانات الحقل إلى API:', fieldData);

      // تحديد ما إذا كان هذا تحديث أم إنشاء جديد
      const isUpdating = editingField && editingField.id;
      console.log(isUpdating ? '✏️ تحديث حقل موجود:' : '📝 إنشاء حقل جديد:', fieldForm);

      // تحديد URL والطريقة بناءً على نوع العملية
      const url = isUpdating
        ? `${API_BASE_URL}/api/fields/${editingField.id}`
        : `${API_BASE_URL}/api/fields`;
      const method = isUpdating ? 'PUT' : 'POST';

      // إرسال طلب إلى API
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fieldData)
      });

      console.log('🚀 استجابة HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('� محتوى الاستجابة:', result);

      if (response.ok && result.success === true) {
        console.log(isUpdating ? '✅ تم تحديث الحقل بنجاح:' : '✅ تم إنشاء الحقل بنجاح:', result);
        console.log('📋 العملية المختارة قبل التحديث:', selectedProcess);
        console.log('📋 عدد الحقول قبل التحديث:', selectedProcess?.fields?.length || 0);

        if (isUpdating) {
          // تحديث الحقل الموجود في الحالة
          updateFieldInProcess(selectedProcess.id, result.data);
        } else {
          // إضافة الحقل الجديد إلى الحالة
          addFieldToProcess(selectedProcess.id, result.data);
        }

        // انتظار قصير للتأكد من تحديث الحالة
        setTimeout(() => {
          console.log('📋 العملية المختارة بعد التحديث:', selectedProcess);
          console.log('📋 عدد الحقول بعد التحديث:', selectedProcess?.fields?.length || 0);
        }, 100);

        // إعادة تعيين النموذج وإغلاق المودال
        setFieldForm({ name: '', type: 'text', is_required: false, options: [] });
        setEditingField(null);

        alert(isUpdating ? 'تم تحديث الحقل بنجاح!' : 'تم إنشاء الحقل بنجاح!');
      } else {
        console.error(isUpdating ? '❌ فشل في تحديث الحقل:' : '❌ فشل في إنشاء الحقل:', result);
        alert(`فشل في ${isUpdating ? 'تحديث' : 'إنشاء'} الحقل: ${result?.message || 'خطأ غير معروف'}`);
      }

    } catch (error) {
      const isUpdating = editingField && editingField.id;
      console.error(isUpdating ? '❌ خطأ في تحديث الحقل:' : '❌ خطأ في إنشاء الحقل:', error);
      alert(`خطأ في ${isUpdating ? 'تحديث' : 'إنشاء'} الحقل: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsCreatingField(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      if (!selectedProcess) {
        alert('لم يتم اختيار عملية لحذف الحقل منها');
        return;
      }

      // العثور على الحقل للتحقق من أنه ليس حقل نظام
      const field = selectedProcess.fields.find(f => f.id === fieldId);
      if (!field) {
        alert('الحقل غير موجود');
        return;
      }

      if (field.is_system_field) {
        alert('لا يمكن حذف حقول النظام');
        return;
      }

      // تأكيد الحذف
      const confirmDelete = window.confirm(
        `هل أنت متأكد من حذف الحقل "${field.name}"؟\n\nسيتم حذف جميع البيانات المرتبطة بهذا الحقل نهائياً.`
      );

      if (!confirmDelete) {
        return;
      }

      setIsDeletingField(fieldId);

      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        console.error('❌ رمز الوصول مطلوب لحذف الحقل');
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      console.log('🗑️ حذف الحقل:', fieldId);

      // إرسال طلب DELETE إلى API
      const response = await fetch(`${API_BASE_URL}/api/fields/${fieldId}`, {
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
        console.log('✅ تم حذف الحقل بنجاح:', result);

        // استخدام الدالة المحسنة لحذف الحقل من الحالة بكفاءة
        removeFieldFromProcess(selectedProcess.id, fieldId);

        alert('تم حذف الحقل بنجاح!');
      } else {
        console.error('❌ فشل في حذف الحقل:', result);
        alert(`فشل في حذف الحقل: ${result?.message || 'خطأ غير معروف'}`);
      }

    } catch (error) {
      console.error('❌ خطأ في حذف الحقل:', error);
      alert(`خطأ في حذف الحقل: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsDeletingField(null);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      if (!selectedProcess) {
        alert('لم يتم اختيار عملية لحذف المرحلة منها');
        return;
      }

      // العثور على المرحلة للتحقق من خصائصها
      const stage = selectedProcess.stages.find(s => s.id === stageId);
      if (!stage) {
        alert('المرحلة غير موجودة');
        return;
      }

      // منع حذف المرحلة الوحيدة في العملية
      if (selectedProcess.stages.length <= 1) {
        alert('لا يمكن حذف المرحلة الوحيدة في العملية');
        return;
      }

      // تأكيد الحذف مع تحذير
      const confirmDelete = window.confirm(
        `هل أنت متأكد من حذف المرحلة "${stage.name}"؟\n\n` +
        `تحذير: سيتم حذف جميع البيانات المرتبطة بهذه المرحلة نهائياً.\n` +
        `إذا كانت هناك تذاكر في هذه المرحلة، فلن يتم حذفها.`
      );

      if (!confirmDelete) {
        return;
      }

      setIsDeletingStage(stageId);

      // الحصول على token المصادقة
      let token = localStorage.getItem('auth_token');
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        console.error('❌ رمز الوصول مطلوب لحذف المرحلة');
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      console.log('🗑️ حذف المرحلة:', stageId);

      // إرسال طلب DELETE إلى API
      const response = await fetch(`${API_BASE_URL}/api/stages/${stageId}`, {
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
        console.log('✅ تم حذف المرحلة بنجاح');

        // استخدام الدالة المحسنة لحذف المرحلة من الحالة بكفاءة
        removeStageFromProcess(selectedProcess.id, stageId);

        alert('تم حذف المرحلة بنجاح!');
      } else {
        console.error('❌ فشل في حذف المرحلة:', result);

        // رسائل خطأ مخصصة حسب نوع المشكلة
        if (result?.message?.includes('تحتوي على تذاكر')) {
          alert('لا يمكن حذف المرحلة لأنها تحتوي على تذاكر نشطة.\nيرجى نقل التذاكر إلى مرحلة أخرى أولاً.');
        } else if (result?.message?.includes('غير موجودة')) {
          alert('المرحلة غير موجودة أو تم حذفها مسبقاً');
        } else {
          alert(`فشل في حذف المرحلة: ${result?.message || 'خطأ غير معروف'}`);
        }
      }

    } catch (error) {
      console.error('❌ خطأ في حذف المرحلة:', error);
      alert(`خطأ في حذف المرحلة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsDeletingStage(null);
    }
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
                    <button
                      onClick={() => handleStartEdit(selectedProcess)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteProcess(selectedProcess.id)}
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
                    onClick={() => {
                      const maxPriority = selectedProcess.stages.length > 0
                        ? Math.max(...selectedProcess.stages.map(s => s.priority || 0))
                        : 0;

                      // إعداد حالة المرحلة الجديدة
                      setEditingStage({
                        id: '',
                        name: '',
                        description: '',
                        color: 'bg-gray-500',
                        order: selectedProcess.stages.length + 1,
                        priority: maxPriority + 1,
                        allowed_transitions: [],
                        is_initial: false,
                        is_final: false,
                        sla_hours: null,
                        fields: [],
                        transition_rules: [],
                        automation_rules: []
                      });

                      // إعداد نموذج المرحلة الجديدة
                      setStageForm({
                        name: '',
                        description: '',
                        color: 'bg-gray-500',
                        order: selectedProcess.stages.length + 1,
                        priority: maxPriority + 1,
                        allowed_transitions: [],
                        is_initial: false,
                        is_final: false,
                        sla_hours: undefined
                      });
                    }}
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 space-x-reverse text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة مرحلة</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedProcess.stages.map((stage, index) => {
                    // 🔍 سجل تشخيصي لكل مرحلة
                    console.log(`🔍 المرحلة ${index + 1}: ${stage.name}`);
                    console.log('   - is_initial:', stage.is_initial, '(نوع:', typeof stage.is_initial, ')');
                    console.log('   - is_final:', stage.is_final, '(نوع:', typeof stage.is_final, ')');
                    console.log('   - سيظهر badge "أولى"?', stage.is_initial ? 'نعم ✅' : 'لا ❌');
                    console.log('   - سيظهر badge "نهائية"?', stage.is_final ? 'نعم ✅' : 'لا ❌');
                    
                    return (
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
                          onClick={() => {
                            console.log('🔍 فتح نموذج تعديل المرحلة:', stage);
                            console.log('   - is_initial:', stage.is_initial, '(نوع:', typeof stage.is_initial, ')');
                            console.log('   - is_final:', stage.is_final, '(نوع:', typeof stage.is_final, ')');

                            // إعداد حالة المرحلة للتحرير
                            setEditingStage(stage);

                            // ملء النموذج بالبيانات الحالية للمرحلة
                            // ✅ إصلاح: استخدام === true بدلاً من || false للحفاظ على القيم الصحيحة
                            setStageForm({
                              name: stage.name || '',
                              description: stage.description || '',
                              color: stage.color || 'bg-gray-500',
                              order: stage.order || 1,
                              priority: stage.priority || 1,
                              allowed_transitions: stage.allowed_transitions || ((stage as any).transitions ? (stage as any).transitions.map((t: any) => t.to_stage_id) : []),
                              is_initial: stage.is_initial === true,
                              is_final: stage.is_final === true,
                              sla_hours: stage.sla_hours || undefined
                            });

                            console.log('📝 النموذج بعد الملء:');
                            console.log('   - is_initial:', stage.is_initial === true);
                            console.log('   - is_final:', stage.is_final === true);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        {selectedProcess.stages.length > 1 && (
                            <>
                              <div className="text-gray-400 font-medium">#{stage.priority}</div>
                              <button
                                onClick={() => handleDeleteStage(stage.id)}
                                disabled={isDeletingStage === stage.id}
                                className="p-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {isDeletingStage === stage.id ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                )}
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
                    );
                  })}
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
                          {fieldTypes.find(t => t.value === (field as any).field_type || field.type)?.label || 'غير محدد'}
                        </span>
                        {field.is_required && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">إجباري</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            console.log('🖱️ النقر على تحرير الحقل:', field);
                            console.log('🔍 نوع البيانات:', typeof field);
                            console.log('🔍 خصائص الحقل:', Object.keys(field));
                            console.log('🔍 field.field_type:', (field as any).field_type);
                            console.log('🔍 field.type:', (field as any).type);
                            console.log('🔍 البيانات الكاملة:', JSON.stringify(field, null, 2));
                            setEditingField(field);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          disabled={isDeletingField === field.id}
                          className="p-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isDeletingField === field.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
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
              <div className="space-y-3">N
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
                              const newTransitions = [...stageForm.allowed_transitions, stage.id];
                              console.log('✅ إضافة مرحلة للانتقالات:', stage.name, stage.id);
                              console.log('📋 الانتقالات الجديدة:', newTransitions);
                              setStageForm({
                                ...stageForm,
                                allowed_transitions: newTransitions
                              });
                            } else {
                              const newTransitions = stageForm.allowed_transitions.filter(id => id !== stage.id);
                              console.log('❌ إزالة مرحلة من الانتقالات:', stage.name, stage.id);
                              console.log('📋 الانتقالات الجديدة:', newTransitions);
                              setStageForm({
                                ...stageForm,
                                allowed_transitions: newTransitions
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
                onClick={editingStage?.id ? handleUpdateStage : handleAddStage}
                disabled={!stageForm.name || isCreatingStage || isUpdatingStage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {(isCreatingStage || isUpdatingStage) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{editingStage?.id ? 'جاري التحديث...' : 'جاري الإنشاء...'}</span>
                  </>
                ) : (
                  <span>{editingStage?.id ? 'حفظ التغييرات' : 'إضافة مرحلة'}</span>
                )}
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
                  onChange={(e) => {
                    console.log('🔄 تغيير نوع الحقل من', fieldForm.type, 'إلى', e.target.value);
                    setFieldForm({ ...fieldForm, type: e.target.value as FieldType });
                  }}
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
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={isCreatingField}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddField}
                disabled={!fieldForm.name.trim() || isCreatingField}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {isCreatingField && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>
                  {isCreatingField
                    ? 'جاري الإنشاء...'
                    : editingField.id ? 'حفظ' : 'إضافة'
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Process Modal */}
      {isEditing && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">تعديل العملية</h3>
              <button
                onClick={handleCancelEdit}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={isUpdating}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العملية *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: عملية المشتريات"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف العملية..."
                  rows={3}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللون</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditForm({ ...editForm, color })}
                      className={`w-8 h-8 rounded-full border-2 ${color} ${
                        editForm.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      disabled={isUpdating}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأيقونة</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon.value}
                      onClick={() => setEditForm({ ...editForm, icon: icon.value })}
                      className={`p-2 rounded-lg border ${
                        editForm.icon === icon.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      disabled={isUpdating}
                    >
                      <icon.icon className="w-5 h-5 text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                disabled={isUpdating}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateProcess}
                disabled={!editForm.name.trim() || isUpdating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {isUpdating && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isUpdating ? 'جاري التحديث...' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};