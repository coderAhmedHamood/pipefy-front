-- Migration: إصلاح constraint لحقل recurring_worker_interval
-- الهدف: تغيير constraint من الثواني (10-3600) إلى الدقائق (1-60)
-- التاريخ: 2025-12-18

-- إزالة constraint القديم إذا كان موجوداً
ALTER TABLE settings
  DROP CONSTRAINT IF EXISTS settings_recurring_worker_interval_check;

-- إضافة constraint جديد بالدقائق (1-60 دقيقة)
ALTER TABLE settings
  ADD CONSTRAINT settings_recurring_worker_interval_check 
  CHECK (recurring_worker_interval >= 1 AND recurring_worker_interval <= 60);

-- تحديث القيم الموجودة: تحويل من ثواني إلى دقائق (إذا كانت > 60)
-- القيم بين 1-60 تبقى كما هي (افترض أنها دقائق بالفعل)
UPDATE settings 
SET recurring_worker_interval = CASE
  WHEN recurring_worker_interval IS NULL THEN 1
  WHEN recurring_worker_interval > 60 THEN CEIL(recurring_worker_interval / 60.0)::INTEGER
  WHEN recurring_worker_interval < 1 THEN 1
  ELSE recurring_worker_interval
END
WHERE recurring_worker_interval IS NULL 
   OR recurring_worker_interval > 60 
   OR recurring_worker_interval < 1;

-- تحديث التعليق
COMMENT ON COLUMN settings.recurring_worker_interval IS 
  'فترة فحص القواعد المستحقة للتذاكر المتكررة بالدقائق (1-60 دقيقة)';

