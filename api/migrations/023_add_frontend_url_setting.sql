-- Migration: إضافة حقل frontend_url لإعدادات النظام
-- الهدف: إضافة حقل لتخزين رابط الواجهة الأمامية لاستخدامه في روابط الإيميلات
-- التاريخ: 2025-11-08

-- إضافة حقل frontend_url
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS frontend_url TEXT DEFAULT 'http://localhost:8080';

-- تحديث القيم الافتراضية للبيانات الموجودة
UPDATE settings 
SET frontend_url = COALESCE(frontend_url, 'http://localhost:8080')
WHERE frontend_url IS NULL;

-- عرض رسالة نجاح
SELECT 
    'تم إضافة حقل frontend_url بنجاح' as message,
    frontend_url
FROM settings
LIMIT 1;

