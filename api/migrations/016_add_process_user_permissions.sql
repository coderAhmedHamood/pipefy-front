-- Migration: إضافة صلاحية إدارة صلاحيات العمليات على المستخدمين
-- الهدف: إضافة صلاحية جديدة للتحكم في صلاحيات المستخدمين على العمليات
-- التاريخ: 2025-11-05

-- إضافة الصلاحية الجديدة
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إدارة صلاحيات العمليات على المستخدمين', 'processes', 'manage_user_permissions', 'إدارة صلاحيات المستخدمين على العمليات')
ON CONFLICT (resource, action) DO NOTHING;

-- ربط الصلاحية الجديدة بدور المدير (admin)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  p.id,
  NOW()
FROM permissions p
WHERE p.resource = 'processes' AND p.action = 'manage_user_permissions'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط الصلاحية بجميع الأدوار التي لديها صلاحية processes.manage
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  rp.role_id,
  p.id,
  NOW()
FROM role_permissions rp
INNER JOIN permissions p ON p.resource = 'processes' AND p.action = 'manage_user_permissions'
INNER JOIN permissions p2 ON rp.permission_id = p2.id
WHERE p2.resource = 'processes' AND p2.action = 'manage'
  AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = rp.role_id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- عرض رسالة نجاح
SELECT 
  'تم إضافة صلاحية إدارة صلاحيات العمليات على المستخدمين بنجاح' as message,
  COUNT(*) as permission_count
FROM permissions
WHERE resource = 'processes' AND action = 'manage_user_permissions';

