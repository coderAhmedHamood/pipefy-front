-- Migration: إضافة حقل max_executions إلى جدول recurring_rules
-- الهدف: إضافة حقل لتحديد الحد الأقصى لعدد مرات التنفيذ
-- التاريخ: 2025-11-23

-- إضافة حقل max_executions (الحد الأقصى لعدد التنفيذات)
ALTER TABLE recurring_rules
ADD COLUMN IF NOT EXISTS max_executions INTEGER;

-- إنشاء فهرس على الحقل الجديد (اختياري - للبحث السريع)
CREATE INDEX IF NOT EXISTS idx_recurring_max_executions ON recurring_rules(max_executions);

-- عرض رسالة نجاح
SELECT 
  '✅ تم إضافة حقل max_executions إلى جدول recurring_rules بنجاح' as message,
  COUNT(*) as total_rules,
  COUNT(*) FILTER (WHERE max_executions IS NOT NULL) as rules_with_max_executions
FROM recurring_rules;

