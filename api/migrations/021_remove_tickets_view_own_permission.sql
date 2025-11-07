-- Migration: حذف صلاحية tickets.view_own
-- الهدف: حذف صلاحية tickets.view_own من النظام
-- التاريخ: 2025-11-05

-- حذف جميع الروابط من الأدوار أولاً
DELETE FROM role_permissions 
WHERE permission_id = (
  SELECT id FROM permissions 
  WHERE resource = 'tickets' AND action = 'view_own'
);

-- حذف الصلاحية
DELETE FROM permissions 
WHERE resource = 'tickets' AND action = 'view_own';

-- عرض رسالة نجاح
SELECT 
  'تم حذف صلاحية tickets.view_own بنجاح' as message,
  COUNT(*) as remaining_tickets_permissions
FROM permissions
WHERE resource = 'tickets';

