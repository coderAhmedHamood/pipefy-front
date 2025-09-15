import React, { useState } from 'react';
import { ApiIntegration } from '../../types/workflow';
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Play, 
  Pause,
  Globe,
  Key,
  Shield,
  CheckCircle,
  AlertTriangle,
  Code,
  Webhook,
  Mail,
  MessageSquare
} from 'lucide-react';

export const IntegrationManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ApiIntegration | null>(null);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);

  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    type: 'webhook' as const,
    endpoint: '',
    method: 'POST' as const,
    headers: {} as Record<string, string>,
    authentication: {
      type: 'none' as const,
      credentials: {} as Record<string, string>
    },
    trigger_events: [] as string[],
    is_active: true
  });

  const integrationTypes = [
    { value: 'webhook', label: 'Webhook', icon: Webhook },
    { value: 'rest_api', label: 'REST API', icon: Globe },
    { value: 'graphql', label: 'GraphQL', icon: Code }
  ];

  const authTypes = [
    { value: 'none', label: 'بدون مصادقة' },
    { value: 'api_key', label: 'API Key' },
    { value: 'bearer_token', label: 'Bearer Token' },
    { value: 'basic_auth', label: 'Basic Auth' }
  ];

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const availableEvents = [
    'ticket_created',
    'ticket_updated',
    'ticket_deleted',
    'stage_changed',
    'user_assigned',
    'due_date_changed',
    'comment_added',
    'process_created',
    'process_updated'
  ];

  const predefinedIntegrations = [
    {
      name: 'Slack',
      description: 'إرسال إشعارات إلى قنوات Slack',
      icon: MessageSquare,
      color: 'bg-purple-500',
      template: {
        type: 'webhook' as const,
        method: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        trigger_events: ['ticket_created', 'stage_changed', 'user_assigned']
      }
    },
    {
      name: 'Microsoft Teams',
      description: 'إرسال إشعارات إلى Microsoft Teams',
      icon: MessageSquare,
      color: 'bg-blue-500',
      template: {
        type: 'webhook' as const,
        method: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        trigger_events: ['ticket_created', 'stage_changed']
      }
    },
    {
      name: 'Email Service',
      description: 'إرسال إشعارات عبر البريد الإلكتروني',
      icon: Mail,
      color: 'bg-green-500',
      template: {
        type: 'rest_api' as const,
        method: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        trigger_events: ['ticket_created', 'due_date_changed', 'overdue']
      }
    }
  ];

  const handleCreateIntegration = () => {
    const newIntegration: ApiIntegration = {
      id: Date.now().toString(),
      ...integrationForm,
      created_at: new Date().toISOString()
    };

    setIntegrations([...integrations, newIntegration]);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setIntegrationForm({
      name: '',
      type: 'webhook',
      endpoint: '',
      method: 'POST',
      headers: {},
      authentication: {
        type: 'none',
        credentials: {}
      },
      trigger_events: [],
      is_active: true
    });
  };

  const toggleIntegrationStatus = (integrationId: string) => {
    setIntegrations(integrations.map(integration =>
      integration.id === integrationId
        ? { ...integration, is_active: !integration.is_active }
        : integration
    ));
  };

  const testIntegration = async (integrationId: string) => {
    setTestingIntegration(integrationId);
    
    // محاكاة اختبار التكامل
    setTimeout(() => {
      setTestingIntegration(null);
      // يمكن إضافة منطق الاختبار الفعلي هنا
    }, 2000);
  };

  const addHeader = () => {
    const key = prompt('اسم الـ Header:');
    const value = prompt('قيمة الـ Header:');
    if (key && value) {
      setIntegrationForm({
        ...integrationForm,
        headers: { ...integrationForm.headers, [key]: value }
      });
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...integrationForm.headers };
    delete newHeaders[key];
    setIntegrationForm({ ...integrationForm, headers: newHeaders });
  };

  const useTemplate = (template: any, name: string) => {
    setIntegrationForm({
      ...integrationForm,
      name,
      ...template
    });
    setIsCreating(true);
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 space-x-reverse">
              <Zap className="w-8 h-8 text-purple-500" />
              <span>التكاملات الخارجية</span>
            </h1>
            <p className="text-gray-600">ربط النظام مع الخدمات والأنظمة الخارجية</p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>تكامل جديد</span>
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* Quick Setup Templates */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">قوالب سريعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predefinedIntegrations.map((template, index) => {
              const Icon = template.icon;
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center space-x-3 space-x-reverse mb-3">
                    <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => useTemplate(template.template, template.name)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    استخدام القالب
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Integrations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">التكاملات النشطة</h3>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              {integrations.length} تكامل
            </span>
          </div>

          <div className="space-y-4">
            {integrations.map((integration) => {
              const TypeIcon = integrationTypes.find(t => t.value === integration.type)?.icon || Globe;
              return (
                <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        integration.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <TypeIcon className={`w-4 h-4 ${
                          integration.is_active ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{integration.name}</h4>
                        <p className="text-sm text-gray-500">
                          {integrationTypes.find(t => t.value === integration.type)?.label} - {integration.method}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => testIntegration(integration.id)}
                        disabled={testingIntegration === integration.id}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors text-blue-600"
                        title="اختبار التكامل"
                      >
                        {testingIntegration === integration.id ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => toggleIntegrationStatus(integration.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          integration.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {integration.is_active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => setEditingIntegration(integration)}
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
                      <span className="font-medium">الرابط:</span> {integration.endpoint}
                    </div>
                    <div>
                      <span className="font-medium">المصادقة:</span> {authTypes.find(a => a.value === integration.authentication.type)?.label}
                    </div>
                    <div>
                      <span className="font-medium">الأحداث:</span> {integration.trigger_events.length} حدث
                    </div>
                  </div>
                </div>
              );
            })}
            
            {integrations.length === 0 && (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تكاملات</h3>
                <p className="text-gray-500 mb-4">ابدأ بإنشاء تكامل جديد أو استخدم أحد القوالب السريعة</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                >
                  إنشاء تكامل جديد
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Integration Modal */}
      {(isCreating || editingIntegration) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIntegration ? 'تعديل التكامل' : 'تكامل جديد'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingIntegration(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم التكامل</label>
                  <input
                    type="text"
                    value={integrationForm.name}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="مثال: Slack Notifications"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع التكامل</label>
                  <select
                    value={integrationForm.type}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {integrationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Endpoint and Method */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">رابط الـ API</label>
                  <input
                    type="url"
                    value={integrationForm.endpoint}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, endpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
                  <select
                    value={integrationForm.method}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, method: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {httpMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Authentication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المصادقة</label>
                <select
                  value={integrationForm.authentication.type}
                  onChange={(e) => setIntegrationForm({
                    ...integrationForm,
                    authentication: { ...integrationForm.authentication, type: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {authTypes.map((auth) => (
                    <option key={auth.value} value={auth.value}>
                      {auth.label}
                    </option>
                  ))}
                </select>
                
                {integrationForm.authentication.type === 'api_key' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {integrationForm.authentication.type === 'bearer_token' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Bearer Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {integrationForm.authentication.type === 'basic_auth' && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Username"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Headers</label>
                  <button
                    onClick={addHeader}
                    className="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1 space-x-reverse"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة Header</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(integrationForm.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <input
                        type="text"
                        value={value}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => removeHeader(key)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Events */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأحداث المحفزة</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={integrationForm.trigger_events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIntegrationForm({
                              ...integrationForm,
                              trigger_events: [...integrationForm.trigger_events, event]
                            });
                          } else {
                            setIntegrationForm({
                              ...integrationForm,
                              trigger_events: integrationForm.trigger_events.filter(e => e !== event)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                      />
                      <span className="mr-2 text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={integrationForm.is_active}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                />
                <label htmlFor="active" className="mr-2 text-sm text-gray-700">
                  تفعيل التكامل
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingIntegration(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateIntegration}
                disabled={!integrationForm.name || !integrationForm.endpoint}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIntegration ? 'حفظ التغييرات' : 'إنشاء التكامل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};