-- Migration: حذف صلاحية tickets.edit وتحديث اسم tickets.update
-- الهدف: حذف صلاحية tickets.edit وتغيير اسم tickets.update إلى "تعديل التذاكر"
-- التاريخ: 2025-11-05

-- حذف صلاحية tickets.edit
DELETE FROM role_permissions 
WHERE permission_id = (
  SELECT id FROM permissions 
  WHERE resource = 'tickets' AND action = 'edit'
);

DELETE FROM permissions 
WHERE resource = 'tickets' AND action = 'edit';

-- تحديث اسم صلاحية tickets.update
UPDATE permissions
SET name = 'تعديل التذاكر',
    description = 'تعديل التذاكر الموجودة'
WHERE resource = 'tickets' AND action = 'update';

-- عرض رسالة نجاح
SELECT 
  'تم حذف صلاحية tickets.edit وتحديث اسم tickets.update بنجاح' as message,
  COUNT(*) as tickets_update_count
FROM permissions
WHERE resource = 'tickets' AND action = 'update';

