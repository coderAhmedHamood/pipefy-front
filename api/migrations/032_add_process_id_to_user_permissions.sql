-- Migration: إضافة حقل process_id إلى جدول user_permissions
-- الهدف: ربط صلاحيات المستخدم بالعمليات
-- التاريخ: 2025-11-16

-- 1. إضافة العمود process_id كحقل nullable مؤقتاً
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS process_id UUID REFERENCES processes(id) ON DELETE CASCADE;

-- 2. تحديث جميع السجلات الموجودة بـ process_id من الصلاحية المرتبطة
UPDATE user_permissions up
SET process_id = p.process_id
FROM permissions p
WHERE up.permission_id = p.id
  AND up.process_id IS NULL;

-- 3. جعل الحقل إجبارياً (NOT NULL)
ALTER TABLE user_permissions 
ALTER COLUMN process_id SET NOT NULL;

-- 4. إضافة فهرس على process_id لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_permissions_process_id ON user_permissions(process_id);

-- 5. تحديث UNIQUE constraint ليشمل process_id
-- ملاحظة: هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_id_permission_id_key;

ALTER TABLE user_permissions 
ADD CONSTRAINT user_permissions_user_permission_process_key UNIQUE(user_id, permission_id, process_id);

-- 6. إضافة فهرس مركب على (user_id, permission_id, process_id) لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_permission_process 
ON user_permissions(user_id, permission_id, process_id);

-- عرض رسالة نجاح
SELECT 
  'تم إضافة حقل process_id إلى جدول user_permissions بنجاح' as message,
  COUNT(*) as total_user_permissions,
  COUNT(DISTINCT process_id) as unique_processes
FROM user_permissions;

