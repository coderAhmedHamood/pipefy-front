import React, { useState } from 'react';
import { User, UserRole, Permission } from '../../types/workflow';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  Shield, 
  Key,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      role: {
        id: 'admin',
        name: 'مدير النظام',
        description: 'صلاحيات كاملة',
        permissions: [],
        is_system_role: true
      },
      permissions: [],
      created_at: new Date().toISOString(),
      is_active: true
    },
    {
      id: '2',
      name: 'فاطمة أحمد',
      email: 'fatima@example.com',
      role: {
        id: 'member',
        name: 'عضو',
        description: 'صلاحيات محدودة',
        permissions: [],
        is_system_role: true
      },
      permissions: [],
      created_at: new Date().toISOString(),
      is_active: true
    }
  ]);

  const [roles, setRoles] = useState<UserRole[]>([
    {
      id: 'admin',
      name: 'مدير النظام',
      description: 'صلاحيات كاملة لإدارة النظام',
      permissions: [],
      is_system_role: true
    },
    {
      id: 'member',
      name: 'عضو',
      description: 'صلاحيات أساسية للعمل',
      permissions: [],
      is_system_role: true
    },
    {
      id: 'guest',
      name: 'ضيف',
      description: 'صلاحيات محدودة للعرض فقط',
      permissions: [],
      is_system_role: true
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    is_active: true
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const availablePermissions = [
    { id: 'create_tickets', name: 'إنشاء التذاكر', resource: 'tickets', action: 'create' },
    { id: 'edit_tickets', name: 'تعديل التذاكر', resource: 'tickets', action: 'edit' },
    { id: 'delete_tickets', name: 'حذف التذاكر', resource: 'tickets', action: 'delete' },
    { id: 'view_tickets', name: 'عرض التذاكر', resource: 'tickets', action: 'view' },
    { id: 'manage_processes', name: 'إدارة العمليات', resource: 'processes', action: 'manage' },
    { id: 'manage_users', name: 'إدارة المستخدمين', resource: 'users', action: 'manage' },
    { id: 'view_reports', name: 'عرض التقارير', resource: 'reports', action: 'view' },
    { id: 'system_settings', name: 'إعدادات النظام', resource: 'system', action: 'settings' }
  ];

  const handleCreateUser = () => {
    const selectedRole = roles.find(r => r.id === userForm.role_id);
    if (!selectedRole) return;

    const newUser: User = {
      id: Date.now().toString(),
      name: userForm.name,
      email: userForm.email,
      role: selectedRole,
      permissions: [],
      created_at: new Date().toISOString(),
      is_active: userForm.is_active
    };

    setUsers([...users, newUser]);
    setIsCreatingUser(false);
    setUserForm({ name: '', email: '', password: '', role_id: '', is_active: true });
  };

  const handleCreateRole = () => {
    const newRole: UserRole = {
      id: Date.now().toString(),
      name: roleForm.name,
      description: roleForm.description,
      permissions: availablePermissions.filter(p => roleForm.permissions.includes(p.id)),
      is_system_role: false
    };

    setRoles([...roles, newRole]);
    setIsCreatingRole(false);
    setRoleForm({ name: '', description: '', permissions: [] });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleDeleteRole = (roleId: string) => {
    if (roles.find(r => r.id === roleId)?.is_system_role) return;
    setRoles(roles.filter(r => r.id !== roleId));
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, is_active: !u.is_active } : u
    ));
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'member': return <Users className="w-4 h-4" />;
      case 'guest': return <Eye className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
            <p className="text-gray-600">إضافة وتعديل المستخدمين والأدوار والصلاحيات</p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            {selectedTab === 'users' && (
              <button
                onClick={() => setIsCreatingUser(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <UserPlus className="w-4 h-4" />
                <span>مستخدم جديد</span>
              </button>
            )}
            
            {selectedTab === 'roles' && (
              <button
                onClick={() => setIsCreatingRole(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <Shield className="w-4 h-4" />
                <span>دور جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 space-x-reverse bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمين ({users.length})</span>
          </button>
          
          <button
            onClick={() => setSelectedTab('roles')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'roles'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>الأدوار ({roles.length})</span>
          </button>
          
          <button
            onClick={() => setSelectedTab('permissions')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'permissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>الصلاحيات ({availablePermissions.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="البحث في المستخدمين..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span>تصفية</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">
                              انضم في {new Date(user.created_at).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 space-x-reverse px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role.id)}`}>
                          {getRoleIcon(user.role.id)}
                          <span>{user.role.name}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? 'نشط' : 'معطل'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-400 text-lg mb-2">لا توجد مستخدمين</div>
                  <p className="text-gray-500 text-sm">ابدأ بإضافة مستخدم جديد</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'roles' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-lg ${getRoleColor(role.id)}`}>
                      {getRoleIcon(role.id)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                  </div>
                  
                  {!role.is_system_role && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">المستخدمين:</span>
                    <span className="font-medium">{users.filter(u => u.role.id === role.id).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">الصلاحيات:</span>
                    <span className="font-medium">{role.permissions.length}</span>
                  </div>
                  {role.is_system_role && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      دور النظام
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'permissions' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الصلاحيات المتاحة</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{permission.name}</h4>
                        <p className="text-sm text-gray-500">
                          {permission.resource} - {permission.action}
                        </p>
                      </div>
                      <Key className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreatingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">مستخدم جديد</h3>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اسم المستخدم"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="كلمة المرور"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                <select
                  value={userForm.role_id}
                  onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر الدور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="active" className="mr-2 text-sm text-gray-700">
                  مستخدم نشط
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => setIsCreatingUser(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!userForm.name || !userForm.email || !userForm.role_id}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {isCreatingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">دور جديد</h3>
              <button
                onClick={() => setIsCreatingRole(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الدور</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: مدير المشاريع"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف الدور والمسؤوليات..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={roleForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({
                              ...roleForm,
                              permissions: [...roleForm.permissions, permission.id]
                            });
                          } else {
                            setRoleForm({
                              ...roleForm,
                              permissions: roleForm.permissions.filter(p => p !== permission.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <label htmlFor={permission.id} className="mr-3 text-sm text-gray-700">
                        {permission.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => setIsCreatingRole(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!roleForm.name}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};