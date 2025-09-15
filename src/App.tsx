import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndContext } from '@dnd-kit/core';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowProvider, useWorkflow } from './contexts/WorkflowContext';
import { Sidebar } from './components/layout/Sidebar';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ProcessSelector } from './components/dashboard/ProcessSelector';
import { ProcessManager } from './components/processes/ProcessManager';
import { UserManager } from './components/users/UserManager';
import { ReportsManager } from './components/reports/ReportsManager';
import { SettingsManager } from './components/settings/SettingsManager';
import { HelpCenter } from './components/help/HelpCenter';
import { AutomationManager } from './components/automation/AutomationManager';
import { RecurringManager } from './components/recurring/RecurringManager';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { IntegrationManager } from './components/integrations/IntegrationManager';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { SetupGuide } from './components/setup/SetupGuide';
import { ApiDocumentation } from './components/api/ApiDocumentation';
import { Login } from './components/auth/Login';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Menu, X, HelpCircle, BookOpen } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const { processes, selectedProcess, setSelectedProcess } = useWorkflow();
  const [currentView, setCurrentView] = useState('kanban');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <MainDashboard />;
      
      case 'kanban':
        if (!selectedProcess) {
          return (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">ن</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">مرحباً بك في نظام إدارة العمليات</h2>
                <p className="text-gray-600 mb-6">اختر عملية للبدء في العمل على التذاكر</p>
                <ProcessSelector
                  processes={processes}
                  selectedProcess={selectedProcess}
                  onProcessSelect={setSelectedProcess}
                />
              </div>
            </div>
          );
        }
        return <KanbanBoard process={selectedProcess} />;
      
      case 'processes':
        return (
          <ProcessManager />
        );
      
      case 'users':
        return (
          <UserManager />
        );
      
      case 'reports':
        return (
          <ReportsManager />
        );
      
      case 'notifications':
        return (
          <NotificationCenter />
        );
      
      case 'automation':
        return <AutomationManager />;
      
      case 'recurring':
        return <RecurringManager />;
      
      case 'integrations':
        return <IntegrationManager />;
      
      case 'setup':
        return <SetupGuide />;
      
      case 'api':
        return <ApiDocumentation />;
      
      case 'settings':
        return (
          <SettingsManager />
        );
      
      case 'help':
        return (
          <HelpCenter />
        );
      
      default:
        return <div>غير موجود</div>;
    }
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
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ن</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">نظام إدارة العمليات</h1>
              </div>
              
              {selectedProcess && (
                <>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <ProcessSelector
                    processes={processes}
                    selectedProcess={selectedProcess}
                    onProcessSelect={setSelectedProcess}
                  />
                </>
              )}
            </div>
            
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
          </div>
        </div>

        <div className="h-[calc(100vh-73px)]">
          {renderContent()}
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
                    setCurrentView(view);
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
          onViewChange={setCurrentView}
        />
        
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <MainApp />
      </WorkflowProvider>
    </AuthProvider>
  );
}

export default App;