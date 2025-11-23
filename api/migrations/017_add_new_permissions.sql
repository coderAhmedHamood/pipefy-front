-- Migration: إضافة صلاحيات جديدة (التذاكر المتكررة، الشعارات، توثيق API، لوحة المعلومات)
-- الهدف: إضافة صلاحيات جديدة للنظام
-- التاريخ: 2025-11-05

-- إضافة الصلاحيات الجديدة
INSERT INTO permissions (name, resource, action, description) VALUES
  -- تم تغيير tickets.recurring إلى recurring_rules.manage في migration 037
  ('عرض لوحة المعلومات', 'reports', 'dashboard', 'الوصول إلى لوحة المعلومات والإحصائيات الشاملة'),
  ('إدارة الشعارات', 'system', 'logos', 'رفع وتعديل شعارات النظام'),
  ('عرض توثيق API', 'api', 'documentation', 'الوصول إلى توثيق واجهة برمجة التطبيقات')
ON CONFLICT (resource, action) DO NOTHING;

-- ربط الصلاحيات الجديدة بدور المدير (admin)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  p.id,
  NOW()
FROM permissions p
WHERE (p.resource = 'reports' AND p.action = 'dashboard')
   OR (p.resource = 'system' AND p.action = 'logos')
   OR (p.resource = 'api' AND p.action = 'documentation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- تم نقل ربط recurring_rules.manage إلى migration 037

-- ربط reports.dashboard بجميع الأدوار التي لديها صلاحية reports.view
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  rp.role_id,
  p.id,
  NOW()
FROM role_permissions rp
INNER JOIN permissions p ON p.resource = 'reports' AND p.action = 'dashboard'
INNER JOIN permissions p2 ON rp.permission_id = p2.id
WHERE p2.resource = 'reports' AND p2.action = 'view'
  AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = rp.role_id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط system.logos بجميع الأدوار التي لديها صلاحية system.settings
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  rp.role_id,
  p.id,
  NOW()
FROM role_permissions rp
INNER JOIN permissions p ON p.resource = 'system' AND p.action = 'logos'
INNER JOIN permissions p2 ON rp.permission_id = p2.id
WHERE p2.resource = 'system' AND p2.action = 'settings'
  AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = rp.role_id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ربط api.documentation بجميع الأدوار (صلاحية عامة)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE p.resource = 'api' AND p.action = 'documentation'
  AND r.id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = r.id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- عرض رسالة نجاح
SELECT 
  'تم إضافة الصلاحيات الجديدة بنجاح' as message,
  COUNT(*) as permissions_count
FROM permissions
WHERE (resource = 'reports' AND action = 'dashboard')
   OR (resource = 'system' AND action = 'logos')
   OR (resource = 'api' AND action = 'documentation');

