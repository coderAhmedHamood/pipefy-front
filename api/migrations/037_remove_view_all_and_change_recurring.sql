-- Migration: حذف صلاحية tickets.view_all وتغيير tickets.recurring إلى recurring_rules.manage
-- الهدف: 
-- 1. حذف صلاحية tickets.view_all
-- 2. تغيير صلاحية tickets.recurring إلى recurring_rules.manage (قسم منفصل)
-- التاريخ: 2025-11-23

-- ===== 1. حذف صلاحية tickets.view_all من role_permissions =====
DELETE FROM role_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions 
  WHERE resource = 'tickets' AND action = 'view_all'
);

-- ===== 2. حذف صلاحية tickets.view_all من user_permissions =====
DELETE FROM user_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions 
  WHERE resource = 'tickets' AND action = 'view_all'
);

-- ===== 3. حذف صلاحية tickets.view_all من جدول permissions =====
DELETE FROM permissions 
WHERE resource = 'tickets' AND action = 'view_all';

-- ===== 4. تغيير صلاحية tickets.recurring إلى recurring_rules.manage =====
-- تحديث الصلاحية الموجودة
UPDATE permissions 
SET 
  resource = 'recurring_rules',
  action = 'manage',
  name = 'إدارة قواعد التكرار',
  description = 'إنشاء وإدارة قواعد التكرار التي تنشئ تذاكر تلقائياً في تواريخ محددة'
WHERE resource = 'tickets' AND action = 'recurring';

-- ===== 5. ربط recurring_rules.manage بدور المدير (admin) =====
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  p.id,
  NOW()
FROM permissions p
WHERE p.resource = 'recurring_rules' AND p.action = 'manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===== 6. ربط recurring_rules.manage بجميع الأدوار التي لديها صلاحية tickets.manage =====
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  rp.role_id,
  p.id,
  NOW()
FROM role_permissions rp
INNER JOIN permissions p ON p.resource = 'recurring_rules' AND p.action = 'manage'
INNER JOIN permissions p2 ON rp.permission_id = p2.id
WHERE p2.resource = 'tickets' AND p2.action = 'manage'
  AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = rp.role_id 
    AND permission_id = p.id
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===== 7. عرض رسالة نجاح =====
SELECT 
  '✅ تم حذف tickets.view_all وتغيير tickets.recurring إلى recurring_rules.manage بنجاح' as message,
  (SELECT COUNT(*) FROM permissions WHERE resource = 'tickets' AND action = 'view_all') as remaining_view_all,
  (SELECT COUNT(*) FROM permissions WHERE resource = 'tickets' AND action = 'recurring') as remaining_tickets_recurring,
  (SELECT COUNT(*) FROM permissions WHERE resource = 'recurring_rules' AND action = 'manage') as new_recurring_rules_manage;

