-- Migration: التراجع عن إضافة process_id إلى جدول permissions
-- الهدف: إزالة حقل process_id من جدول permissions (الصلاحيات عامة)
-- التاريخ: 2025-11-16

-- 1. إزالة UNIQUE constraint الجديد
ALTER TABLE permissions 
DROP CONSTRAINT IF EXISTS permissions_resource_action_process_key;

-- 2. إعادة UNIQUE constraint الأصلي
ALTER TABLE permissions 
ADD CONSTRAINT permissions_resource_action_key UNIQUE(resource, action);

-- 3. إزالة الفهارس المركبة
DROP INDEX IF EXISTS idx_permissions_resource_action_process;
DROP INDEX IF EXISTS idx_permissions_process_id;

-- 4. إزالة العمود process_id
ALTER TABLE permissions 
DROP COLUMN IF EXISTS process_id;

-- عرض رسالة نجاح
SELECT 
  'تم إزالة process_id من جدول permissions بنجاح' as message,
  COUNT(*) as total_permissions
FROM permissions;

