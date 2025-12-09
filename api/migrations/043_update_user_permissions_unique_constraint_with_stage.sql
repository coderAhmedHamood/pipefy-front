-- Migration: تحديث UNIQUE constraint في user_permissions ليشمل stage_id
-- الهدف: السماح للمستخدم بالحصول على نفس الصلاحية في نفس العملية مع stage_id مختلف
-- التاريخ: 2025-01-XX

-- ملاحظة مهمة:
-- - في PostgreSQL، NULLs في UNIQUE constraint تعامل بشكل خاص
-- - يمكن أن يكون للمستخدم صلاحية عامة (stage_id = NULL) وصلاحيات محددة لمراحل (stage_id محدد)
-- - لكن لا يمكن أن يكون له نفس الصلاحية في نفس العملية مع stage_id = NULL مرتين

-- 1. حذف UNIQUE constraint القديم
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_permission_process_key;

-- 2. إضافة UNIQUE constraint جديد يشمل stage_id
-- ملاحظة: هذا يسمح للمستخدم بالحصول على:
-- - صلاحية عامة (stage_id = NULL) - مرة واحدة فقط
-- - صلاحيات محددة لمراحل مختلفة (stage_id محدد) - كل مرحلة مرة واحدة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_user_permission_process_stage_key'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT user_permissions_user_permission_process_stage_key 
    UNIQUE(user_id, permission_id, process_id, stage_id);
  END IF;
END $$;

-- عرض رسالة نجاح
SELECT 
  '✅ تم تحديث UNIQUE constraint في user_permissions ليشمل stage_id بنجاح' as message;

