import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import notificationService from '../../services/notificationService';

import {
  Home,
  Settings,
  Users,
  FolderOpen,
  BarChart3,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  RefreshCw,
  Globe,
  Code
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'لوحة المعلومات', icon: BarChart3 },
  { id: 'kanban', label: 'لوحة كانبان', icon: Home },
  { id: 'processes', label: 'العمليات', icon: FolderOpen },
  { id: 'users', label: 'المستخدمين', icon: Users },
  { id: 'automation', label: 'الأتمتة', icon: Zap },
  { id: 'recurring', label: 'التذاكر المتكررة', icon: RefreshCw },
  { id: 'integrations', label: 'التكاملات', icon: Globe },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'api', label: 'توثيق API', icon: Code },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'setup', label: 'دليل الإعداد', icon: Settings },
  { id: 'help', label: 'المساعدة', icon: HelpCircle }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  currentView,
  onViewChange
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // جلب عدد الإشعارات غير المقروءة
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        console.log('📊 Sidebar - استجابة عدد الإشعارات:', response);
        if (response.success && response.data) {
          const count = response.data.unread_count || response.data.count || 0;
          console.log('✅ Sidebar - عدد الإشعارات غير المقروءة:', count);
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('❌ Sidebar - خطأ في جلب عدد الإشعارات:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // استخراج المسار الحالي
  const currentPath = location.pathname.slice(1) || 'kanban';

  return (
    <div className={`
      bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
      min-h-screen flex flex-col
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ن</span>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-900">نظام العمليات</h2>
                <p className="text-xs text-gray-500">إدارة متقدمة</p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-medium text-gray-900 text-sm">{user.name}</h3>
              <p className="text-xs text-gray-500">{user.role.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;

            return (
              <li key={item.id}>
                <Link
                  to={`/${item.id}`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full flex items-center p-3 rounded-lg transition-all duration-200 relative
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${isCollapsed ? 'justify-center' : 'space-x-3 space-x-reverse'}
                  `}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                  )}
                  {!isCollapsed && item.id === 'notifications' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-lg">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Tooltip for collapsed sidebar */}
                {isCollapsed && hoveredItem === item.id && (
                  <div className="absolute right-20 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={logout}
          className={`
            w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors
            ${isCollapsed ? 'justify-center' : 'space-x-3 space-x-reverse'}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );
};