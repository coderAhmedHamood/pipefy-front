import React, { useState } from 'react';
import { useDeviceType } from './hooks/useDeviceType';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowProvider, useWorkflow } from './contexts/WorkflowContext';
import { NotificationProvider } from './components/ui/NotificationSystem';
import { SystemSettingsProvider, useSystemSettings } from './contexts/SystemSettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DynamicFavicon } from './components/ui/DynamicFavicon';
import { Sidebar } from './components/layout/Sidebar';
import { CompanyHeader } from './components/layout/CompanyHeader';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ProcessSelector } from './components/dashboard/ProcessSelector';
import { HeaderProcessSelector } from './components/layout/HeaderProcessSelector';
import { NotificationBell } from './components/notifications/NotificationBell';
import { LatestNotificationBanner } from './components/notifications/LatestNotificationBanner';
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
import { Menu, X, Edit, Eye, EyeOff, Loader } from 'lucide-react';
import { userService, roleService, authService } from './services';
import { useQuickNotifications } from './components/ui/NotificationSystem';

// مكون معلومات المستخدم
const UserInfo: React.FC = () => {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!user) return null;

  return (
    <>
      <div 
        className="flex items-center space-x-4 space-x-reverse cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setShowProfileModal(true)}
      >
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

      {showProfileModal && (
        <UserProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </>
  );
};

// مكون Modal ملف المستخدم الشخصي
const UserProfileModal: React.FC<{ user: any; onClose: () => void }> = ({ user, onClose }) => {
  const { user: currentUser } = useAuth();
  const notifications = useQuickNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userForm, setUserForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role_id: user.role_id || user.role?.id || '',
    is_active: user.is_active !== undefined ? user.is_active : true
  });

  // جلب الأدوار عند فتح الـ modal
  React.useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await roleService.getAllRoles({ include_permissions: true });
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (error) {
        console.error('خطأ في جلب الأدوار:', error);
      }
    };
    loadRoles();
  }, []);

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const updateData: any = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role_id: userForm.role_id,
        is_active: userForm.is_active
      };

      const updatedUser = await userService.updateUser(currentUser.id, updateData);

      // تحديث بيانات المستخدم في localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));

      // إعادة تحميل الصفحة لتحديث بيانات المستخدم في AuthContext
      window.location.reload();

      notifications.showSuccess('تم تحديث بياناتك بنجاح');
      setIsEditing(false);
    } catch (error: any) {
      console.error('❌ خطأ في تحديث المستخدم:', error);
      notifications.showError(error.message || 'فشل في تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // التحقق من صحة البيانات
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notifications.showError('يرجى ملء جميع حقول كلمة المرور');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifications.showError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      notifications.showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      setChangingPassword(true);

      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      notifications.showSuccess('تم تغيير كلمة المرور بنجاح');
      
      // مسح حقول كلمة المرور
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('❌ خطأ في تغيير كلمة المرور:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل في تغيير كلمة المرور';
      notifications.showError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">ملف المستخدم الشخصي</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
            {isEditing ? (
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اسم المستخدم"
                disabled={loading}
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {userForm.name || 'غير محدد'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
            {isEditing ? (
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
                disabled={loading}
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {userForm.email || 'غير محدد'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف (اختياري)</label>
            {isEditing ? (
              <input
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+966501234567"
                disabled={loading}
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {userForm.phone || 'غير محدد'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
            {isEditing ? (
              <select
                value={userForm.role_id}
                onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">اختر الدور</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {user.role?.name || 'غير محدد'}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="profile-active"
              checked={userForm.is_active}
              onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={loading || !isEditing}
            />
            <label htmlFor="profile-active" className="mr-2 text-sm text-gray-700">
              مستخدم نشط
            </label>
          </div>

          {/* قسم تغيير كلمة المرور */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">تغيير كلمة المرور</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور الحالية"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={changingPassword}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور الجديدة"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={changingPassword}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={changingPassword}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
              >
                {changingPassword ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري التغيير...</span>
                  </>
                ) : (
                  <span>تغيير كلمة المرور</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إغلاق
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 space-x-reverse"
              >
                <Edit className="w-4 h-4" />
                <span>تعديل</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setUserForm({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    role_id: user.role_id || user.role?.id || '',
                    is_active: user.is_active !== undefined ? user.is_active : true
                  });
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading || changingPassword}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={!userForm.name || !userForm.email || !userForm.role_id || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    <span>تحديث</span>
                  </>
                )}
              </button>
            </>
          )}
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
  const { isMobile, isTablet } = useDeviceType();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // استخراج المسار الحالي
  const currentView = location.pathname.slice(1) || 'kanban';

  // دالة للتنقل بين الصفحات
  const handleViewChange = (view: string) => {
    // إذا كان view هو 'logout'، لا نحتاج للتنقل
    if (view !== 'logout') {
      navigate(`/${view}`);
    }
  };

  // وضع الكانبان ملء الشاشة على الجوال/التابلت فقط
  if ((isMobile || isTablet) && currentView === 'kanban' && !showSidebar) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden" dir="rtl">
        {/* Kanban Header */}
        <div className="bg-white border-b border-gray-200">
          {/* Header الرئيسي */}
          <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} flex items-center justify-between`}>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <CompanyHeader size="medium" />
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Process Selector مخفي على الجوال - موجود في KanbanMobileView */}
              {!isMobile && !isTablet && (
                <HeaderProcessSelector
                  processes={processes}
                  selectedProcess={selectedProcess}
                  onProcessSelect={setSelectedProcess}
                  compact={true}
                />
              )}
              <NotificationBell />
              <UserInfo />
            </div>
          </div>
          
          {/* Latest Notification - منفصل على الجوال فقط */}
          {(isMobile || isTablet) && (
            <div className="px-3 pb-3">
              <LatestNotificationBanner />
            </div>
          )}
          
          {/* Latest Notification - في المنتصف على Desktop */}
          {!isMobile && !isTablet && (
            <div className="px-4 pb-3">
              <div className="flex justify-center">
                <LatestNotificationBanner />
              </div>
            </div>
          )}
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

  // على الجوال/التابلت: إخفاء الـ sidebar وإظهار زر القائمة
  if (isMobile || isTablet) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} flex items-center justify-between`}>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <CompanyHeader size={isMobile || isTablet ? "medium" : "small"} />
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Process Selector مخفي على الجوال */}
              {!isMobile && !isTablet && (
                <HeaderProcessSelector
                  processes={processes}
                  selectedProcess={selectedProcess}
                  onProcessSelect={setSelectedProcess}
                  compact={true}
                />
              )}
              <NotificationBell />
              <UserInfo />
            </div>
          </div>
          
          {/* Latest Notification - منفصل على الجوال فقط */}
          {(isMobile || isTablet) && (
            <div className="px-3 pb-3">
              <LatestNotificationBanner />
            </div>
          )}
        </div>

        {/* المحتوى الرئيسي */}
        <div className={`${isMobile || isTablet ? 'h-[calc(100vh-73px)]' : 'flex-1 overflow-y-auto'}`}>
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
                  className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors bg-white shadow-lg"
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

  // الوضع العادي مع Sidebar على Desktop
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
              <div className="flex items-center space-x-4 space-x-reverse">
                <CompanyHeader size="small" />
              </div>

              {/* Latest Notification في المنتصف */}
              <div className="flex-1 flex justify-center">
                <LatestNotificationBanner />
              </div>

              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Process Selector في الجهة اليمنى */}
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
          <ThemeProvider>
            <DynamicFavicon />
            <WorkflowProvider>
              <NotificationProvider>
                <ProtectedRoutes />
              </NotificationProvider>
            </WorkflowProvider>
          </ThemeProvider>
        </SystemSettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;