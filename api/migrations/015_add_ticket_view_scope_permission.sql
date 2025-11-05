-- Migration: إضافة صلاحية التحكم في نطاق عرض التذاكر
-- الهدف: إضافة صلاحية جديدة للتحكم في ما إذا كان المستخدم يرى تذاكر الجميع أو تذاكره الخاصة فقط
-- التاريخ: 2025-11-05

-- إضافة الصلاحية الجديدة
INSERT INTO permissions (name, resource, action, description) VALUES
  ('التحكم في نطاق عرض التذاكر', 'tickets', 'view_scope', 'التحكم في ما إذا كان المستخدم يرى تذاكر الجميع أو تذاكره الخاصة فقط')
ON CONFLICT (resource, action) DO NOTHING;

-- ربط الصلاحية الجديدة بدور المدير (admin)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  p.id,
  NOW()
FROM permissions p
WHERE p.resource = 'tickets' AND p.action = 'view_scope'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط الصلاحية بجميع الأدوار التي لديها صلاحية tickets.view_all
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  rp.role_id,
  p.id,
  NOW()
FROM role_permissions rp
INNER JOIN permissions p ON p.resource = 'tickets' AND p.action = 'view_scope'
INNER JOIN permissions p2 ON rp.permission_id = p2.id
WHERE p2.resource = 'tickets' AND p2.action = 'view_all'
  AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = rp.role_id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- عرض رسالة نجاح
SELECT 
  'تم إضافة صلاحية التحكم في نطاق عرض التذاكر بنجاح' as message,
  COUNT(*) as permission_count
FROM permissions
WHERE resource = 'tickets' AND action = 'view_scope';

