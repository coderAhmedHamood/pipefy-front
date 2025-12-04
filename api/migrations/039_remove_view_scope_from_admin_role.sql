-- Migration: إزالة صلاحية tickets.view_scope من دور admin
-- الهدف: استبعاد صلاحية "عرض التذاكر الخاصة بالموظف فقط" من دور admin
-- التاريخ: 2025-11-23

-- حذف صلاحية tickets.view_scope من دور admin
DELETE FROM role_permissions
WHERE role_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE resource = 'tickets' AND action = 'view_scope'
  );

-- عرض رسالة نجاح
SELECT 
  '✅ تم إزالة صلاحية tickets.view_scope من دور admin بنجاح' as message,
  COUNT(*) as remaining_view_scope_permissions
FROM role_permissions rp
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
  AND p.resource = 'tickets' AND p.action = 'view_scope';

