-- Migration: إضافة حقل stage_id إلى جدول user_permissions
-- الهدف: ربط صلاحيات المستخدم بالمراحل (اختياري - nullable)
-- التاريخ: 2025-01-XX

-- ملاحظة مهمة:
-- - stage_id حقل اختياري (nullable) يسمح بربط الصلاحية بمرحلة محددة
-- - إذا كان stage_id = NULL، تعني أن الصلاحية تطبق على جميع المراحل في العملية
-- - إذا كان stage_id محدداً، تعني أن الصلاحية تطبق فقط على المرحلة المحددة

-- 1. إضافة العمود stage_id كحقل nullable (اختياري)
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES stages(id) ON DELETE CASCADE;

-- 2. إضافة فهرس على stage_id لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_permissions_stage_id ON user_permissions(stage_id);

-- 3. إضافة فهرس مركب على (user_id, permission_id, process_id, stage_id) لتحسين الأداء
-- ملاحظة: هذا يساعد في الاستعلامات التي تبحث عن صلاحيات محددة في مرحلة محددة
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_permission_process_stage 
ON user_permissions(user_id, permission_id, process_id, stage_id);

-- 4. ملاحظة: لا نحدث UNIQUE constraint لأن:
-- - قد يكون للمستخدم نفس الصلاحية في نفس العملية ولكن في مراحل مختلفة
-- - أو نفس الصلاحية في نفس العملية بدون تحديد مرحلة (stage_id = NULL)
-- - UNIQUE constraint الحالي (user_id, permission_id, process_id) يمنع التكرار بدون stage_id

-- عرض رسالة نجاح
SELECT 
  '✅ تم إضافة حقل stage_id إلى جدول user_permissions بنجاح' as message,
  COUNT(*) as total_user_permissions,
  COUNT(CASE WHEN stage_id IS NOT NULL THEN 1 END) as permissions_with_stage,
  COUNT(CASE WHEN stage_id IS NULL THEN 1 END) as permissions_without_stage
FROM user_permissions;

