-- Migration: إدراج البيانات الأساسية للنظام
-- Created: 2025-09-15

-- إدراج الأدوار الأساسية
INSERT INTO roles (id, name, description, is_system_role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'مدير النظام', TRUE),
  ('550e8400-e29b-41d4-a716-446655440002', 'member', 'عضو', TRUE),
  ('550e8400-e29b-41d4-a716-446655440003', 'guest', 'ضيف', TRUE)
ON CONFLICT (name) DO NOTHING;

-- إدراج الصلاحيات الأساسية
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إنشاء التذاكر', 'tickets', 'create', 'إنشاء تذاكر جديدة'),
  ('تعديل التذاكر', 'tickets', 'edit', 'تعديل التذاكر الموجودة'),
  ('حذف التذاكر', 'tickets', 'delete', 'حذف التذاكر'),
  ('عرض جميع التذاكر', 'tickets', 'view_all', 'عرض جميع التذاكر في النظام'),
  ('عرض التذاكر الخاصة', 'tickets', 'view_own', 'عرض التذاكر الخاصة بالمستخدم فقط'),
  ('إدارة العمليات', 'processes', 'manage', 'إنشاء وتعديل العمليات'),
  ('عرض العمليات', 'processes', 'view', 'عرض العمليات'),
  ('إدارة المستخدمين', 'users', 'manage', 'إدارة حسابات المستخدمين'),
  ('عرض المستخدمين', 'users', 'view', 'عرض قائمة المستخدمين'),
  ('عرض التقارير', 'reports', 'view', 'الوصول للتقارير والإحصائيات'),
  ('إعدادات النظام', 'system', 'settings', 'تعديل إعدادات النظام'),
  ('إدارة الأتمتة', 'automation', 'manage', 'إنشاء وتعديل قواعد الأتمتة'),
  ('إدارة التكاملات', 'integrations', 'manage', 'إدارة التكاملات الخارجية'),
  ('إدارة الأدوار', 'roles', 'manage', 'إنشاء وتعديل الأدوار'),
  ('عرض الأدوار', 'roles', 'view', 'عرض قائمة الأدوار'),
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
