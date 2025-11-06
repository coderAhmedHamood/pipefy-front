-- Migration: إدراج البيانات الأساسية للنظام
-- Created: 2025-09-15

-- إدراج الأدوار الأساسية
INSERT INTO roles (id, name, description, is_system_role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'مدير النظام', TRUE),
  ('550e8400-e29b-41d4-a716-446655440002', 'member', 'عضو', TRUE),
  ('550e8400-e29b-41d4-a716-446655440003', 'guest', 'ضيف', TRUE)
ON CONFLICT (name) DO NOTHING;

-- إدراج الصلاحيات الأساسية الكاملة (42 صلاحية)
INSERT INTO permissions (name, resource, action, description) VALUES
  -- صلاحيات Fields (الحقول) - 4 صلاحيات
  ('إنشاء الحقول', 'fields', 'create', 'إنشاء حقول جديدة'),
  ('حذف الحقول', 'fields', 'delete', 'حذف الحقول'),
  ('عرض الحقول', 'fields', 'read', 'عرض الحقول'),
  ('تعديل الحقول', 'fields', 'update', 'تعديل الحقول الموجودة'),
  
  -- صلاحيات Processes (العمليات) - 7 صلاحيات
  ('إنشاء العمليات', 'processes', 'create', 'إنشاء عمليات جديدة'),
  ('حذف العمليات', 'processes', 'delete', 'حذف العمليات'),
  ('عرض تفاصيل العمليات', 'processes', 'read', 'عرض تفاصيل العمليات'),
  ('تعديل العمليات', 'processes', 'update', 'تعديل العمليات الموجودة'),
  ('إدارة العمليات', 'processes', 'manage', 'إدارة كاملة للعمليات'),
  ('عرض العمليات', 'processes', 'view', 'عرض قائمة العمليات'),
  ('إدارة صلاحيات العمليات على المستخدمين', 'processes', 'manage_user_permissions', 'إدارة صلاحيات المستخدمين على العمليات'),
  
  -- صلاحيات Stages (المراحل) - 4 صلاحيات
  ('إنشاء المراحل', 'stages', 'create', 'إنشاء مراحل جديدة'),
  ('حذف المراحل', 'stages', 'delete', 'حذف المراحل'),
  ('عرض المراحل', 'stages', 'read', 'عرض المراحل'),
  ('تعديل المراحل', 'stages', 'update', 'تعديل المراحل الموجودة'),
  
  -- صلاحيات Tickets (التذاكر) - 10 صلاحيات
  ('إنشاء التذاكر', 'tickets', 'create', 'إنشاء تذاكر جديدة'),
  ('حذف التذاكر', 'tickets', 'delete', 'حذف التذاكر'),
  ('تعديل التذاكر', 'tickets', 'edit', 'تعديل التذاكر الموجودة'),
  ('إدارة التذاكر', 'tickets', 'manage', 'إدارة كاملة للتذاكر'),
  ('عرض التذاكر', 'tickets', 'read', 'عرض التذاكر'),
  ('تحديث التذاكر', 'tickets', 'update', 'تحديث التذاكر الموجودة'),
  ('عرض جميع التذاكر', 'tickets', 'view_all', 'عرض جميع التذاكر في النظام'),
  ('عرض التذاكر الخاصة', 'tickets', 'view_own', 'عرض التذاكر الخاصة بالمستخدم فقط'),
  ('التحكم في نطاق عرض التذاكر', 'tickets', 'view_scope', 'التحكم في ما إذا كان المستخدم يرى تذاكر الجميع أو تذاكره الخاصة فقط'),
  ('إدارة التذاكر المتكررة', 'tickets', 'recurring', 'إنشاء وإدارة التذاكر المتكررة'),
  
  -- صلاحيات Ticket Reviewers (المراجعين) - 2 صلاحيات
  ('عرض المراجعين وتقييم المراجعين', 'ticket_reviewers', 'view', 'عرض المراجعين وتقييم المراجعين للتذاكر'),
  ('إضافة مراجعين إلى التذكرة', 'ticket_reviewers', 'create', 'إضافة مراجعين إلى التذاكر'),
  
  -- صلاحيات Ticket Assignees (المسندين) - 1 صلاحية
  ('إضافة مسندين إلى التذكرة', 'ticket_assignees', 'create', 'إضافة مستخدمين مسندين إلى التذاكر'),
  
  -- صلاحيات Users (المستخدمين) - 5 صلاحيات
  ('إنشاء المستخدمين', 'users', 'create', 'إنشاء مستخدمين جدد'),
  ('حذف المستخدمين', 'users', 'delete', 'حذف المستخدمين'),
  ('تعديل المستخدمين', 'users', 'edit', 'تعديل بيانات المستخدمين'),
  ('إدارة المستخدمين', 'users', 'manage', 'إدارة كاملة للمستخدمين'),
  ('عرض المستخدمين', 'users', 'view', 'عرض قائمة المستخدمين'),
  
  -- صلاحيات Reports (التقارير) - 2 صلاحيات
  ('عرض التقارير', 'reports', 'view', 'الوصول للتقارير والإحصائيات'),
  ('عرض لوحة المعلومات', 'reports', 'dashboard', 'الوصول إلى لوحة المعلومات والإحصائيات الشاملة'),
  
  -- صلاحيات System (النظام) - 2 صلاحيات
  ('إعدادات النظام', 'system', 'settings', 'تعديل إعدادات النظام'),
  ('إدارة الشعارات', 'system', 'logos', 'رفع وتعديل شعارات النظام'),
  
  -- صلاحيات Automation (الأتمتة) - 1 صلاحية
  ('إدارة الأتمتة', 'automation', 'manage', 'إنشاء وتعديل قواعد الأتمتة'),
  
  -- صلاحيات Integrations (التكاملات) - 1 صلاحية
  ('إدارة التكاملات', 'integrations', 'manage', 'إدارة التكاملات الخارجية'),
  
  -- صلاحيات API (واجهة برمجة التطبيقات) - 1 صلاحية
  ('عرض توثيق API', 'api', 'documentation', 'الوصول إلى توثيق واجهة برمجة التطبيقات'),
  
  -- صلاحيات Roles (الأدوار) - 2 صلاحية
  ('إدارة الأدوار', 'roles', 'manage', 'إنشاء وتعديل الأدوار'),
  ('عرض الأدوار', 'roles', 'view', 'عرض قائمة الأدوار'),
  
  -- صلاحيات Permissions (الصلاحيات) - 1 صلاحية
  ('إدارة الصلاحيات', 'permissions', 'manage', 'إدارة الصلاحيات')
ON CONFLICT (resource, action) DO NOTHING;

-- ربط صلاحيات دور المدير (admin)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط صلاحيات دور العضو (member)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '550e8400-e29b-41d4-a716-446655440002',
  p.id
FROM permissions p
WHERE p.resource IN ('tickets', 'processes') 
  AND p.action IN ('create', 'edit', 'view_own', 'view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط صلاحيات دور الضيف (guest)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '550e8400-e29b-41d4-a716-446655440003',
  p.id
FROM permissions p
WHERE p.resource IN ('tickets', 'processes') 
  AND p.action IN ('view_own', 'view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- إنشاء مستخدم مدير افتراضي
INSERT INTO users (id, name, email, password_hash, role_id, email_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'مدير النظام', 'admin@pipefy.com', '$2b$10$rQZ8kHWKQVnqXSgdHUKOHOxJ8YrJ8YrJ8YrJ8YrJ8YrJ8YrJ8YrJ8Y', '550e8400-e29b-41d4-a716-446655440001', TRUE)
ON CONFLICT (email) DO NOTHING;
