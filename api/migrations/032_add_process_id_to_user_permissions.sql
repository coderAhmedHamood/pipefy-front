-- Migration: إضافة حقل process_id إلى جدول user_permissions فقط
-- الهدف: ربط صلاحيات المستخدم بالعمليات (الصلاحيات نفسها عامة بدون process_id)
-- التاريخ: 2025-11-16

-- ملاحظة مهمة:
-- - جدول permissions: بدون process_id (صلاحيات عامة)
-- - جدول user_permissions: مع process_id (ربط المستخدم بالصلاحية في عملية محددة)
-- هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة

-- 1. إضافة العمود process_id كحقل nullable مؤقتاً
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS process_id UUID REFERENCES processes(id) ON DELETE CASCADE;

-- 2. جعل الحقل إجبارياً (NOT NULL) فقط إذا كان nullable
-- ملاحظة: لا نحدث السجلات الموجودة تلقائياً، يجب تحديد process_id عند منح صلاحية جديدة
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_permissions' 
    AND column_name = 'process_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- حذف السجلات التي لا تحتوي على process_id أولاً
    DELETE FROM user_permissions WHERE process_id IS NULL;
    
    -- ثم جعل الحقل إجبارياً
    ALTER TABLE user_permissions 
    ALTER COLUMN process_id SET NOT NULL;
  END IF;
END $$;

-- 3. إضافة فهرس على process_id لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_permissions_process_id ON user_permissions(process_id);

-- 4. تحديث UNIQUE constraint ليشمل process_id
-- ملاحظة: هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_id_permission_id_key;

-- التحقق من وجود constraint قبل إضافته
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_user_permission_process_key'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT user_permissions_user_permission_process_key UNIQUE(user_id, permission_id, process_id);
  END IF;
END $$;

-- 5. إضافة فهرس مركب على (user_id, permission_id, process_id) لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_permission_process 
ON user_permissions(user_id, permission_id, process_id);

-- 6. حذف السجلات الموجودة التي لا تحتوي على process_id (تم في الخطوة 2)

-- عرض رسالة نجاح
SELECT 
  'تم إضافة حقل process_id إلى جدول user_permissions بنجاح' as message,
  COUNT(*) as total_user_permissions,
  COUNT(DISTINCT process_id) as unique_processes
FROM user_permissions;
