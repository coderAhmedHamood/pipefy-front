-- Migration: إضافة حقل api_base_url لإعدادات النظام
-- الهدف: إضافة حقل لتخزين رابط API الأساسي لاستخدامه في روابط الصور والملفات الثابتة
-- التاريخ: 2025-11-09

-- إضافة حقل api_base_url
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS api_base_url TEXT DEFAULT 'http://localhost:3003';

-- تحديث القيم الافتراضية للبيانات الموجودة
UPDATE settings 
SET api_base_url = COALESCE(api_base_url, 'http://localhost:3003')
WHERE api_base_url IS NULL;

-- عرض رسالة نجاح
SELECT 
    'تم إضافة حقل api_base_url بنجاح' as message,
    api_base_url
FROM settings
LIMIT 1;

