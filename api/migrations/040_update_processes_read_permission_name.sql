-- Migration: تحديث اسم صلاحية processes.read
-- الهدف: تغيير اسم الصلاحية من "عرض تفاصيل العمليات" إلى "عرض العمليات"
-- التاريخ: 2025-01-XX

-- تحديث اسم الصلاحية في جدول permissions
UPDATE permissions
SET 
  name = 'عرض العمليات',
  description = 'عرض العمليات'
WHERE resource = 'processes' AND action = 'read';

-- عرض رسالة نجاح
SELECT 
  '✅ تم تحديث اسم صلاحية processes.read من "عرض تفاصيل العمليات" إلى "عرض العمليات" بنجاح' as message,
  COUNT(*) as updated_count
FROM permissions
WHERE resource = 'processes' AND action = 'read' AND name = 'عرض العمليات';

