-- Migration: إضافة حقل lockout_count إلى جدول users
-- الهدف: تتبع عدد مرات قفل الحساب لحساب مدة القفل المضاعفة
-- التاريخ: 2025-11-09

ALTER TABLE users
ADD COLUMN IF NOT EXISTS lockout_count INTEGER DEFAULT 0;

-- تحديث القيم الافتراضية للبيانات الموجودة
UPDATE users
SET lockout_count = COALESCE(lockout_count, 0)
WHERE lockout_count IS NULL;

-- عرض رسالة نجاح
SELECT
    'تم إضافة حقل lockout_count بنجاح' as message,
    COUNT(*) as users_count
FROM users;

