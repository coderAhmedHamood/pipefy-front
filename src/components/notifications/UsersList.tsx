import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Clock, ChevronRight, Search } from 'lucide-react';
import apiClient from '../../lib/api';
import { useDeviceType } from '../../hooks/useDeviceType';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: {
    name: string;
  };
  last_login?: string;
  is_active: boolean;
}

interface UsersListProps {
  onUserSelect: (user: UserData) => void;
  selectedUserId?: string;
}

export const UsersList: React.FC<UsersListProps> = ({ onUserSelect, selectedUserId }) => {
  const { isMobile, isTablet } = useDeviceType();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastUserRef = useRef<HTMLDivElement | null>(null);

  // جلب المستخدمين
  const fetchUsers = async (pageNum: number) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get(`/users?page=${pageNum}&per_page=20`);
      
      if (response.data) {
        const newUsers = Array.isArray(response.data) ? response.data : response.data.data || [];
        const pagination = response.data.pagination;

        if (pageNum === 1) {
          setUsers(newUsers);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
        }

        if (pagination) {
          setTotalUsers(pagination.total);
          setHasMore(pageNum < pagination.total_pages);
        } else {
          setHasMore(newUsers.length === 20);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل المستخدمين عند التحميل الأول
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchUsers(nextPage);
          return nextPage;
        });
      }
    });

    if (lastUserRef.current) {
      observerRef.current.observe(lastUserRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, users.length]);

  // تنسيق آخر تسجيل دخول
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'لم يسجل دخول';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-SA');
  };

  // الحصول على الأحرف الأولى من الاسم
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className={`${isMobile || isTablet ? 'p-2' : 'p-4'} border-b border-gray-200`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
            <div className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} bg-blue-100 rounded-lg`}>
              <User className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
            <div>
              <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-bold text-gray-900`}>المستخدمين</h3>
              <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>إجمالي: {totalUsers} مستخدم</p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مستخدم..."
            className={`w-full ${isMobile || isTablet ? 'px-3 py-2 pr-10 text-xs' : 'px-4 py-2 pr-10 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 && !isLoading ? (
          <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
            <User className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا يوجد مستخدمين</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(() => {
              const filteredUsers = users.filter((user) => {
                const query = searchQuery.toLowerCase();
                return (
                  user.name?.toLowerCase().includes(query) ||
                  user.email?.toLowerCase().includes(query) ||
                  user.role?.name?.toLowerCase().includes(query)
                );
              });
              
              return filteredUsers.map((user, index) => (
              <div
                key={user.id}
                ref={index === filteredUsers.length - 1 ? lastUserRef : null}
                onClick={() => onUserSelect(user)}
                className={`${isMobile || isTablet ? 'p-2' : 'p-4'} hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedUserId === user.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
              >
                <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} rounded-full object-cover`}
                      />
                    ) : (
                      <div className={`${isMobile || isTablet ? 'w-8 h-8 text-xs' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold`}>
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>

                  {/* معلومات المستخدم */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse mb-0.5' : 'space-x-2 space-x-reverse mb-1'}`}>
                      <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 truncate`}>
                        {user.name}
                      </p>
                      {!user.is_active && (
                        <span className={`${isMobile || isTablet ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} bg-red-100 text-red-600 rounded-full`}>
                          غير نشط
                        </span>
                      )}
                    </div>
                    
                    <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-2 space-x-reverse'} ${isMobile || isTablet ? 'text-[10px] mb-0.5' : 'text-xs mb-1'} text-gray-500`}>
                      <Mail className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                      <span className="truncate">{user.email}</span>
                    </div>

                    <div className={`flex items-center ${isMobile || isTablet ? 'flex-col items-start space-y-0.5' : 'justify-between'}`}>
                      <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-2 space-x-reverse'} ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                        <Shield className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                        <span className="truncate">{user.role?.name || 'مستخدم'}</span>
                      </div>
                      
                      <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-1 space-x-reverse'} ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
                        <Clock className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                        <span>{formatLastLogin(user.last_login)}</span>
                      </div>
                    </div>
                  </div>

                  {/* سهم */}
                  <ChevronRight className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0`} />
                </div>
              </div>
              ));
            })()}
            
            {/* رسالة عدم وجود نتائج */}
            {users.filter((user) => {
              const query = searchQuery.toLowerCase();
              return (
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.role?.name?.toLowerCase().includes(query)
              );
            }).length === 0 && searchQuery && users.length > 0 && (
              <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
                <Search className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا توجد نتائج للبحث</p>
              </div>
            )}

            {/* مؤشر التحميل */}
            {isLoading && (
              <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} text-center`}>
                <div className={`inline-block ${isMobile || isTablet ? 'w-4 h-4 border-2' : 'w-6 h-6 border-3'} border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>جاري التحميل...</p>
              </div>
            )}

            {/* رسالة نهاية القائمة */}
            {!hasMore && users.length > 0 && (
              <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} text-center`}>
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-400`}>تم عرض جميع المستخدمين</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
