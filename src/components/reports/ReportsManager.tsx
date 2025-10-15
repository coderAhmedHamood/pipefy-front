import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { 
  BarChart3, 
  Users, 
  Settings,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Award,
  Zap,
  RefreshCw,
  Loader,
  Calendar
} from 'lucide-react';

interface Process {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  stages?: any[];
}

interface ProcessReport {
  process: Process;
  period: { from: string; to: string };
  basic_stats: {
    total_tickets: number;
    open_tickets: number;
    completed_tickets: number;
    overdue_tickets: number;
    avg_completion_hours: number;
  };
  stage_distribution: Array<{
    stage_name: string;
    ticket_count: number;
    percentage: number;
  }>;
  priority_distribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  completion_rate: {
    total: number;
    completed: number;
    rate: number;
  };
  top_performers: Array<{
    user_name: string;
    completed_tickets: number;
  }>;
}

type TabType = 'users' | 'processes' | 'development';

export const ReportsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('processes');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [processReport, setProcessReport] = useState<ProcessReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  // حقول التاريخ - افتراضياً آخر 30 يوم
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    };
  };
  
  const [dateFrom, setDateFrom] = useState(getDefaultDates().dateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDates().dateTo);

  // جلب جميع العمليات
  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/processes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setProcesses(result.data);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب العمليات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // جلب تقرير عملية معينة
  const fetchProcessReport = async (processId: string, customDateFrom?: string, customDateTo?: string) => {
    setIsLoadingReport(true);
    setProcessReport(null); // إعادة تعيين التقرير السابق
    try {
      const token = localStorage.getItem('auth_token');
      const from = customDateFrom || dateFrom;
      const to = customDateTo || dateTo;
      
      console.log('🔍 جلب تقرير العملية:', processId, 'من:', from, 'إلى:', to);
      
      const url = `${API_BASE_URL}/api/reports/process/${processId}?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 استجابة API:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ نتيجة التقرير:', result);
        
        if (result.success && result.data) {
          setProcessReport(result.data);
        } else {
          console.error('❌ البيانات غير صحيحة:', result);
          alert('فشل في جلب التقرير: البيانات غير صحيحة');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ في الاستجابة:', errorData);
        alert(`فشل في جلب التقرير: ${errorData.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقرير العملية:', error);
      alert('حدث خطأ أثناء جلب التقرير. تحقق من اتصال الإنترنت.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleProcessClick = (process: Process) => {
    console.log('🖱️ تم الضغط على العملية:', process.name, process.id);
    setSelectedProcess(process);
    fetchProcessReport(process.id);
  };
  
  const handleDateChange = () => {
    if (selectedProcess) {
      fetchProcessReport(selectedProcess.id, dateFrom, dateTo);
    }
  };


  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'عاجل جداً';
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  return (
    <div className="h-full bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
            <p className="text-gray-600">تحليل شامل للأداء واتخاذ القرارات</p>
          </div>
          
          <button
            onClick={fetchProcesses}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-4 space-x-reverse mt-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('processes')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'processes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-4 h-4" />
              <span>تقارير العمليات</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Users className="w-4 h-4" />
              <span>تقارير المستخدمين</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('development')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'development'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-4 h-4" />
              <span>قيد التطوير</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* تبويبة العمليات */}
        {activeTab === 'processes' && (
          <>
            {/* Right Panel - قائمة العمليات */}
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
                <h3 className="font-bold text-white text-lg">العمليات</h3>
                <p className="text-blue-100 text-sm mt-1">اختر عملية لعرض التقرير</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {processes.map((process) => (
                    <button
                      key={process.id}
                      onClick={() => handleProcessClick(process)}
                      className={`w-full p-4 text-right hover:bg-blue-50 transition-colors ${
                        selectedProcess?.id === process.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 ${process.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold">{process.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{process.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{process.description}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                            process.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {process.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Left Panel - التقارير */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {!selectedProcess ? (
                /* رسالة اختيار عملية */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">اختر عملية من القائمة</h3>
                    <p className="text-gray-600">اضغط على أي عملية من القائمة اليمنى لعرض التقرير التفصيلي</p>
                  </div>
                </div>
              ) : isLoadingReport ? (
                /* تحميل التقرير */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : processReport && selectedProcess ? (
                  <div className="space-y-6">
                    {/* Header - Date Range with Filters */}
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Calendar className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold mb-1">تقرير الفترة</h2>
                            <div className="flex items-center space-x-3 space-x-reverse text-purple-100">
                              <div className="flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 px-3 py-1 rounded-lg backdrop-blur-sm">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">{new Date(dateFrom).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              <span className="font-bold">←</span>
                              <div className="flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 px-3 py-1 rounded-lg backdrop-blur-sm">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">{new Date(dateTo).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Process Badge */}
                        <div className="flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm">
                          <div className={`w-8 h-8 ${selectedProcess.color} rounded-lg flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{selectedProcess.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-semibold">{selectedProcess.name}</span>
                        </div>
                      </div>
                      
                      {/* Date Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                        <div>
                          <label className="block text-xs font-semibold text-white mb-2 flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>من تاريخ</span>
                          </label>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-white border-opacity-30 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-white focus:border-white transition-all bg-white bg-opacity-90"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-white mb-2 flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>إلى تاريخ</span>
                          </label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-white border-opacity-30 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-white focus:border-white transition-all bg-white bg-opacity-90"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            onClick={handleDateChange}
                            className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 text-sm font-bold flex items-center justify-center space-x-2 space-x-reverse shadow-md"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>تحديث</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* الإحصائيات الأساسية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">إجمالي التذاكر</p>
                            <p className="text-3xl font-bold text-gray-900">{processReport.basic_stats.total_tickets.toString()}</p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">مكتملة</p>
                            <p className="text-3xl font-bold text-green-600">{processReport.basic_stats.completed_tickets.toString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {Number(parseFloat(String(processReport.completion_rate?.rate || 0))).toFixed(1)}% معدل الإنجاز
                            </p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">متأخرة</p>
                            <p className="text-3xl font-bold text-red-600">{processReport.basic_stats.overdue_tickets.toString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {processReport.basic_stats.total_tickets > 0 
                                ? ((processReport.basic_stats.overdue_tickets / processReport.basic_stats.total_tickets) * 100).toFixed(1) 
                                : 0}% من الإجمالي
                            </p>
                          </div>
                          <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">متوسط الإنجاز</p>
                            <p className="text-3xl font-bold text-purple-600">
                              {Number(parseFloat(String(processReport.basic_stats.avg_completion_hours || 0))).toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">ساعة</p>
                          </div>
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* توزيع التذاكر حسب المرحلة */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                        <Target className="w-5 h-5 text-blue-500" />
                        <span>توزيع التذاكر حسب المرحلة</span>
                      </h3>
                      
                      <div className="space-y-3">
                        {processReport.stage_distribution.map((stage, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 space-x-reverse flex-1">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{
                                  backgroundColor: `hsl(${(index * 360) / processReport.stage_distribution.length}, 70%, 50%)`
                                }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{stage.stage_name}</span>
                            </div>
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <span className="text-sm font-bold text-gray-900">{stage.ticket_count.toString()}</span>
                              <span className="text-xs text-gray-500">({Number(parseFloat(String(stage.percentage || 0))).toFixed(1)}%)</span>
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Number(parseFloat(String(stage.percentage || 0)))}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* توزيع حسب الأولوية */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span>توزيع التذاكر حسب الأولوية</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {processReport.priority_distribution.map((priority, index) => (
                          <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 ${getPriorityColor(priority.priority)} rounded-full`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{getPriorityLabel(priority.priority)}</p>
                              <p className="text-xs text-gray-500">{priority.count.toString()} تذكرة ({Number(parseFloat(priority.percentage.toString()) || 0).toFixed(1)}%)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* أفضل الموظفين أداءً */}
                    {processReport.top_performers && processReport.top_performers.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span>أفضل الموظفين أداءً</span>
                        </h3>
                        
                        <div className="space-y-3">
                          {processReport.top_performers.map((performer, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold">{index + 1}</span>
                                </div>
                                <span className="font-medium text-gray-900">{performer.user_name}</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-gray-900">{performer.completed_tickets} تذكرة مكتملة</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedProcess ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد بيانات متاحة</h3>
                      <p className="text-gray-600 mb-4">لم يتم العثور على تقرير لهذه العملية</p>
                      <button
                        onClick={() => fetchProcessReport(selectedProcess.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>حدث خطأ غير متوقع</p>
                  </div>
                )}
            </div>
          </>
        )}

        {/* تبويبة المستخدمين */}
        {activeTab === 'users' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">تقارير المستخدمين</h3>
              <p className="text-gray-600">قريباً... سيتم إضافة تقارير شاملة للمستخدمين</p>
            </div>
          </div>
        )}

        {/* تبويبة قيد التطوير */}
        {activeTab === 'development' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ميزات قيد التطوير</h3>
              <p className="text-gray-600">المزيد من التقارير والإحصائيات قادمة قريباً</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
