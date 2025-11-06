-- Migration: إضافة صلاحية الأتمتة وحذف الصلاحية غير الصحيحة
-- الهدف: إضافة صلاحية الأتمتة وحذف الصلاحية "string" غير الصحيحة
-- التاريخ: 2025-11-05

-- حذف الصلاحية غير الصحيحة "string"
DELETE FROM role_permissions 
WHERE permission_id = (
  SELECT id FROM permissions 
  WHERE resource = 'string' AND action = 'string' AND name = 'string'
);

DELETE FROM permissions 
WHERE resource = 'string' AND action = 'string' AND name = 'string';

-- إضافة صلاحية الأتمتة
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إدارة الأتمتة', 'automation', 'manage', 'إنشاء وتعديل قواعد الأتمتة')
ON CONFLICT (resource, action) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ربط صلاحية الأتمتة بدور المدير (admin)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  p.id,
  NOW()
FROM permissions p
WHERE p.resource = 'automation' AND p.action = 'manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط صلاحية الأتمتة بجميع الأدوار التي لديها صلاحيات إدارة
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  rp.role_id,
  p.id,
  NOW()
FROM role_permissions rp
INNER JOIN permissions p ON p.resource = 'automation' AND p.action = 'manage'
INNER JOIN permissions p2 ON rp.permission_id = p2.id
WHERE ((p2.resource = 'system' AND p2.action = 'settings')
   OR (p2.resource = 'integrations' AND p2.action = 'manage'))
  AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = rp.role_id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- عرض رسالة نجاح
SELECT 
  'تم إضافة صلاحية الأتمتة وحذف الصلاحية غير الصحيحة بنجاح' as message,
  COUNT(*) as automation_permission_count
FROM permissions
WHERE resource = 'automation' AND action = 'manage';

