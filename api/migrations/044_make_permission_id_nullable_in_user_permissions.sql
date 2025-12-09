-- Migration: جعل permission_id nullable في جدول user_permissions
-- الهدف: السماح بإضافة سجلات بدون permission_id عند ربط المستخدم بمرحلة مباشرة
-- التاريخ: 2025-01-XX

-- ملاحظة مهمة:
-- - عندما يكون permission_type = "stage" وليس هناك permission_id، يتم إضافة سجل بدون permission_id
-- - هذا يسمح بربط المستخدم بمرحلة مباشرة بدون الحاجة لصلاحية محددة
-- - permission_id يمكن أن يكون NULL فقط عند وجود stage_id

-- 1. حذف UNIQUE constraint القديم
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_permission_process_key;

ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_permission_process_stage_key;

-- 2. حذف Foreign Key constraint على permission_id مؤقتاً
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_permission_id_fkey;

-- 3. جعل permission_id nullable
ALTER TABLE user_permissions 
ALTER COLUMN permission_id DROP NOT NULL;

-- 4. إعادة إضافة Foreign Key constraint (مع السماح بـ NULL)
ALTER TABLE user_permissions 
ADD CONSTRAINT user_permissions_permission_id_fkey 
FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- 5. إضافة UNIQUE constraint جديد يتعامل مع NULL
-- ملاحظة: في PostgreSQL، NULLs في UNIQUE constraint تعامل بشكل خاص
-- يمكن أن يكون هناك عدة صفوف بنفس القيم مع NULL في permission_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_user_permission_process_stage_key'
  ) THEN
    -- UNIQUE constraint على (user_id, permission_id, process_id, stage_id)
    -- يسمح بـ NULL في permission_id
    ALTER TABLE user_permissions 
    ADD CONSTRAINT user_permissions_user_permission_process_stage_key 
    UNIQUE(user_id, permission_id, process_id, stage_id);
  END IF;
END $$;

-- 6. إضافة CHECK constraint للتأكد من أن:
-- - إذا كان permission_id = NULL، يجب أن يكون stage_id != NULL
-- - إذا كان stage_id = NULL، يجب أن يكون permission_id != NULL
-- (لا يمكن أن يكون كلاهما NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_permission_or_stage_required'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT user_permissions_permission_or_stage_required 
    CHECK (
      (permission_id IS NOT NULL) OR (stage_id IS NOT NULL)
    );
  END IF;
END $$;

-- عرض رسالة نجاح
SELECT 
  '✅ تم جعل permission_id nullable في جدول user_permissions بنجاح' as message,
  COUNT(*) as total_user_permissions,
  COUNT(CASE WHEN permission_id IS NULL THEN 1 END) as permissions_without_permission_id,
  COUNT(CASE WHEN stage_id IS NOT NULL AND permission_id IS NULL THEN 1 END) as stage_only_permissions
FROM user_permissions;

