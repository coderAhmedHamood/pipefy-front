-- Migration: إضافة حقل فترة تنفيذ Worker للتذاكر المتكررة
-- الهدف: السماح للمستخدمين بتحديد فترة فحص القواعد المستحقة من خلال الإعدادات
-- التاريخ: 2025-12-17

-- إضافة حقل recurring_worker_interval (بالدقائق)
-- القيمة الافتراضية: 1 دقيقة
-- الحد الأدنى: 1 دقيقة
-- الحد الأقصى: 60 دقيقة (ساعة واحدة)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS recurring_worker_interval INTEGER DEFAULT 1 
    CHECK (recurring_worker_interval >= 1 AND recurring_worker_interval <= 60);

-- تحديث القيمة الافتراضية للبيانات الموجودة
-- إذا كانت القيمة القديمة بالثواني (>= 10)، نحولها إلى دقائق
UPDATE settings 
SET recurring_worker_interval = CASE 
  WHEN recurring_worker_interval IS NULL THEN 1
  WHEN recurring_worker_interval >= 10 THEN CEIL(recurring_worker_interval / 60.0)::INTEGER
  ELSE 1
END
WHERE recurring_worker_interval IS NULL OR recurring_worker_interval >= 10;

-- إضافة تعليق على العمود
COMMENT ON COLUMN settings.recurring_worker_interval IS 
  'فترة فحص القواعد المستحقة للتذاكر المتكررة بالدقائق (1-60 دقيقة)';

