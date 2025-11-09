-- Migration: إزالة قيد CHECK من حقل system_theme
-- الهدف: السماح بأي قيمة نصية للثيم بدلاً من حصرها في light, dark, auto
-- التاريخ: 2025-11-09

-- إزالة قيد CHECK من حقل system_theme
ALTER TABLE settings
DROP CONSTRAINT IF EXISTS settings_system_theme_check;

-- عرض رسالة نجاح
SELECT
    'تم إزالة قيد CHECK من حقل system_theme بنجاح' as message,
    COUNT(*) as settings_count
FROM settings;

