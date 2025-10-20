import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowProvider, useWorkflow } from './contexts/WorkflowContext';
import { NotificationProvider } from './components/ui/NotificationSystem';
import { SystemSettingsProvider, useSystemSettings } from './contexts/SystemSettingsContext';
import { Sidebar } from './components/layout/Sidebar';
import { CompanyHeader } from './components/layout/CompanyHeader';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ProcessSelector } from './components/dashboard/ProcessSelector';
import { HeaderProcessSelector } from './components/layout/HeaderProcessSelector';
import { NotificationBell } from './components/notifications/NotificationBell';
import { ProcessManager } from './components/processes/ProcessManager';
import { UserManagerNew as UserManager } from './components/users/UserManagerNew';
import { ReportsManager } from './components/reports/ReportsManager';
import { SettingsManager } from './components/settings/SettingsManagerUltraSimple';
import { HelpCenter } from './components/help/HelpCenter';
import { AutomationManager } from './components/automation/AutomationManager';
import { RecurringManager } from './components/recurring/RecurringManager';
import { NotificationManagerEnhanced as NotificationManager } from './components/notifications/NotificationManagerEnhanced';
import { IntegrationManager } from './components/integrations/IntegrationManager';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { SetupGuide } from './components/setup/SetupGuide';
import { ApiDocumentation } from './components/api/ApiDocumentation';
import { Login } from './components/auth/Login';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { DebugInfo } from './components/debug/DebugInfo';
import { Menu, X } from 'lucide-react';

// مكون معلومات المستخدم
const UserInfo: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4 space-x-reverse">
      <div className="flex items-center space-x-2 space-x-reverse">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-500">{user.role.name}</div>
        </div>
      </div>
    </div>
  );
};

// مكون للتعامل مع المسارات المحمية
const ProtectedRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route path="/dashboard" element={<MainApp><MainDashboard /></MainApp>} />
      <Route path="/kanban" element={<MainApp><KanbanContent /></MainApp>} />
      <Route path="/processes" element={<MainApp><ProcessManager /></MainApp>} />
      <Route path="/users" element={<MainApp><UserManager /></MainApp>} />
      <Route path="/reports" element={<MainApp><ReportsManager /></MainApp>} />
      <Route path="/notifications" element={<MainApp><NotificationManager /></MainApp>} />
      <Route path="/automation" element={<MainApp><AutomationManager /></MainApp>} />
      <Route path="/recurring" element={<MainApp><RecurringManager /></MainApp>} />
      <Route path="/integrations" element={<MainApp><IntegrationManager /></MainApp>} />
      <Route path="/setup" element={<MainApp><SetupGuide /></MainApp>} />
      <Route path="/api" element={<MainApp><ApiDocumentation /></MainApp>} />
      <Route path="/settings" element={<MainApp><SettingsManager /></MainApp>} />
      <Route path="/help" element={<MainApp><HelpCenter /></MainApp>} />
      <Route path="/debug" element={<MainApp><DebugInfo /></MainApp>} />
      <Route path="*" element={<MainApp><div>غير موجود</div></MainApp>} />
    </Routes>
  );
};

// مكون محتوى الكانبان
const KanbanContent: React.FC = () => {
  const { processes, selectedProcess, setSelectedProcess } = useWorkflow();
  const { settings } = useSystemSettings();

  if (!selectedProcess) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white font-bold text-2xl">
              {settings.company_name ? settings.company_name.charAt(0) : '🏢'}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            مرحباً بك في {settings.company_name || 'النظام'}
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {processes.length > 0
              ? "جاري تحميل العملية الافتراضية..."
              : "اختر عملية للبدء في العمل على التذاكر"
            }
          </p>

          {processes.length > 0 ? (
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-blue-600 font-medium">جاري التحميل...</span>
            </div>
          ) : (
            <ProcessSelector
              processes={processes}
              selectedProcess={selectedProcess}
              onProcessSelect={setSelectedProcess}
            />
          )}
        </div>
      </div>
    );
  }

  return <KanbanBoard process={selectedProcess} />;
};

const MainApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { processes, selectedProcess, setSelectedProcess } = useWorkflow();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // استخراج المسار الحالي
  const currentView = location.pathname.slice(1) || 'kanban';

  // دالة للتنقل بين الصفحات
  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
  };

  // وضع الكانبان ملء الشاشة
  if (currentView === 'kanban' && !showSidebar) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden" dir="rtl">
        {/* Kanban Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <CompanyHeader size="medium" />

              {/* Process Selector في الهيدر */}
              <HeaderProcessSelector
                processes={processes}
                selectedProcess={selectedProcess}
                onProcessSelect={setSelectedProcess}
                compact={true}
              />

            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <NotificationBell />
              <UserInfo />
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-73px)]">
          {children}
        </div>

        {/* Sidebar Overlay */}
        {showSidebar && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSidebar(false)} />
            <div className="fixed right-0 top-0 h-full z-50">
              <div className="relative">
                <Sidebar
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                  currentView={currentView}
                  onViewChange={(view) => {
                    handleViewChange(view);
                    setShowSidebar(false);
                  }}
                />
                <button
                  onClick={() => setShowSidebar(false)}
                  className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // الوضع العادي مع Sidebar
  return (
    <div className="h-screen bg-gray-50 overflow-hidden" dir="rtl">
      <div className="flex h-full">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header للوضع العادي */}
          <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CompanyHeader size="small" />

              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Process Selector في الهيدر */}
                <HeaderProcessSelector
                  processes={processes}
                  selectedProcess={selectedProcess}
                  onProcessSelect={setSelectedProcess}
                  compact={false}
                />

                <NotificationBell />
                <UserInfo />
              </div>
            </div>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};



function App() {
  return (
    <Router>
      <AuthProvider>
        <SystemSettingsProvider>
          <WorkflowProvider>
            <NotificationProvider>
              <ProtectedRoutes />
            </NotificationProvider>
          </WorkflowProvider>
        </SystemSettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;