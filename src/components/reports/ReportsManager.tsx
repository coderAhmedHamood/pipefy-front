import React, { useState, useMemo } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

export const ReportsManager: React.FC = () => {
  const { processes, tickets } = useWorkflow();
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // تصفية التذاكر حسب الفترة والعملية
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      const inDateRange = ticketDate >= startDate && ticketDate <= endDate;
      const inProcess = selectedProcess === 'all' || ticket.process_id === selectedProcess;
      
      return inDateRange && inProcess;
    });
  }, [tickets, dateRange, selectedProcess]);

  // إحصائيات عامة
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const completed = filteredTickets.filter(t => {
      const process = processes.find(p => p.id === t.process_id);
      const lastStage = process?.stages[process.stages.length - 1];
      return t.current_stage_id === lastStage?.id;
    }).length;
    
    const overdue = filteredTickets.filter(t => 
      t.due_date && new Date(t.due_date) < new Date()
    ).length;
    
    const highPriority = filteredTickets.filter(t => 
      t.priority === 'urgent' || t.priority === 'high'
    ).length;

    return { total, completed, overdue, highPriority };
  }, [filteredTickets, processes]);

  // إحصائيات حسب المرحلة
  const stageStats = useMemo(() => {
    const stageMap = new Map();
    
    filteredTickets.forEach(ticket => {
      const process = processes.find(p => p.id === ticket.process_id);
      const stage = process?.stages.find(s => s.id === ticket.current_stage_id);
      
      if (stage) {
        const key = stage.name;
        stageMap.set(key, (stageMap.get(key) || 0) + 1);
      }
    });
    
    return Array.from(stageMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: ((count / filteredTickets.length) * 100).toFixed(1)
    }));
  }, [filteredTickets, processes]);

  // إحصائيات حسب الأولوية
  const priorityStats = useMemo(() => {
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const priorityLabels = {
      urgent: 'عاجل جداً',
      high: 'عاجل',
      medium: 'متوسط',
      low: 'منخفض'
    };
    
    return priorities.map(priority => ({
      name: priorityLabels[priority],
      count: filteredTickets.filter(t => t.priority === priority).length,
      color: priority === 'urgent' ? 'bg-red-500' :
             priority === 'high' ? 'bg-orange-500' :
             priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
    }));
  }, [filteredTickets]);

  // إحصائيات حسب العملية
  const processStats = useMemo(() => {
    return processes.map(process => {
      const processTickets = filteredTickets.filter(t => t.process_id === process.id);
      const completed = processTickets.filter(t => {
        const lastStage = process.stages[process.stages.length - 1];
        return t.current_stage_id === lastStage?.id;
      }).length;
      
      return {
        name: process.name,
        total: processTickets.length,
        completed,
        completionRate: processTickets.length > 0 ? ((completed / processTickets.length) * 100).toFixed(1) : '0',
        color: process.color
      };
    });
  }, [processes, filteredTickets]);

  // متوسط وقت الإنجاز
  const averageCompletionTime = useMemo(() => {
    const completedTickets = filteredTickets.filter(ticket => {
      const process = processes.find(p => p.id === ticket.process_id);
      const lastStage = process?.stages[process.stages.length - 1];
      return ticket.current_stage_id === lastStage?.id;
    });
    
    if (completedTickets.length === 0) return 0;
    
    const totalTime = completedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const updated = new Date(ticket.updated_at);
      return sum + (updated.getTime() - created.getTime());
    }, 0);
    
    return Math.round(totalTime / completedTickets.length / (1000 * 60 * 60 * 24)); // أيام
  }, [filteredTickets, processes]);

  const exportReport = () => {
    const reportData = {
      period: `${dateRange.start} إلى ${dateRange.end}`,
      process: selectedProcess === 'all' ? 'جميع العمليات' : processes.find(p => p.id === selectedProcess)?.name,
      stats,
      stageStats,
      priorityStats,
      processStats,
      averageCompletionTime
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
            <p className="text-gray-600">متابعة الأداء والإنتاجية</p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>تصدير</span>
            </button>
            
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العملية</label>
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع العمليات</option>
              {processes.map(process => (
                <option key={process.id} value={process.id}>{process.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي التذاكر</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% من الإجمالي
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
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : 0}% من الإجمالي
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
                <p className="text-3xl font-bold text-purple-600">{averageCompletionTime}</p>
                <p className="text-xs text-gray-500">يوم</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <PieChart className="w-5 h-5" />
              <span>توزيع التذاكر حسب المرحلة</span>
            </h3>
            
            {stageStats.length > 0 ? (
            <div className="space-y-3">
              {stageStats.map((stage, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-4 h-4 bg-blue-500 rounded" style={{
                      backgroundColor: `hsl(${(index * 360) / stageStats.length}, 70%, 50%)`
                    }}></div>
                    <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                    <span className="text-xs text-gray-500 mr-1">({stage.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <PieChart className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">لا توجد بيانات للعرض</p>
              </div>
            )}
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-5 h-5" />
              <span>توزيع التذاكر حسب الأولوية</span>
            </h3>
            
            <div className="space-y-3">
              {priorityStats.map((priority, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-4 h-4 ${priority.color} rounded`}></div>
                    <span className="text-sm font-medium text-gray-900">{priority.name}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-gray-900">{priority.count}</span>
                    <span className="text-xs text-gray-500 mr-1">
                      ({filteredTickets.length > 0 ? ((priority.count / filteredTickets.length) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-5 h-5" />
            <span>أداء العمليات</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">العملية</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">إجمالي التذاكر</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">مكتملة</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">معدل الإنجاز</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">التقدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processStats.map((process) => (
                  <tr key={process.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-4 h-4 ${process.color} rounded`}></div>
                        <span className="font-medium text-gray-900">{process.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{process.total}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">{process.completed}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{process.completionRate}%</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${process.completionRate}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Calendar className="w-5 h-5" />
            <span>النشاط الأخير</span>
          </h3>
          
          <div className="space-y-4">
            {filteredTickets.slice(0, 5).map((ticket) => {
              const process = processes.find(p => p.id === ticket.process_id);
              const stage = process?.stages.find(s => s.id === ticket.current_stage_id);
              
              return (
                <div key={ticket.id} className="flex items-center space-x-4 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 ${process?.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-xs">{process?.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                    <p className="text-sm text-gray-500">
                      {process?.name} - {stage?.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">
                      {new Date(ticket.updated_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};