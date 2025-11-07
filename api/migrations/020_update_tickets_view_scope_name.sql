-- Migration: تحديث اسم صلاحية tickets.view_scope
-- الهدف: تغيير اسم الصلاحية من "التحكم في نطاق عرض التذاكر" إلى "عرض التذاكر الخاصة بالموظف فقط"
-- التاريخ: 2025-11-05

-- تحديث اسم الصلاحية
UPDATE permissions
SET name = 'عرض التذاكر الخاصة بالموظف فقط'
WHERE resource = 'tickets' AND action = 'view_scope';

-- عرض رسالة نجاح
SELECT 
  'تم تحديث اسم صلاحية tickets.view_scope بنجاح' as message,
  name,
  resource,
  action
FROM permissions
WHERE resource = 'tickets' AND action = 'view_scope';

