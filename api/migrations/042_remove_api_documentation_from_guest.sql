-- Migration: حذف صلاحية api.documentation من دور guest (عضو)
-- الهدف: استبعاد صلاحية "عرض توثيق API" من دور guest
-- التاريخ: 2025-01-XX

-- حذف صلاحية api.documentation من دور guest إذا كانت موجودة
DELETE FROM role_permissions
WHERE role_id = '550e8400-e29b-41d4-a716-446655440003'::uuid -- guest role
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE resource = 'api' AND action = 'documentation'
  );

-- عرض رسالة نجاح
SELECT 
  '✅ تم حذف صلاحية api.documentation من دور guest (عضو) بنجاح' as message,
  COUNT(*) as remaining_api_doc_permissions
FROM role_permissions rp
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource = 'api' AND p.action = 'documentation'
  AND rp.role_id = '550e8400-e29b-41d4-a716-446655440003'::uuid;

