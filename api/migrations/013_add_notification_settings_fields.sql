-- Migration: إضافة حقول إعدادات الإشعارات المتبقية
-- Created: 2025-01-XX
-- Description: إضافة حقول جديدة لإعدادات الإشعارات في جدول settings
--   - ticket_updated: إشعار عند تحديث تذكرة
--   - ticket_moved: إشعار عند تحريك تذكرة إلى مرحلة أخرى
--   - ticket_review_assigned: إشعار عند تعيين مراجع لتذكرة
--   - ticket_review_updated: إشعار عند تحديث حالة المراجعة

-- إضافة حقول إعدادات الإشعارات الجديدة
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS integrations_email_send_on_update BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_move BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_review_assigned BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_review_updated BOOLEAN DEFAULT TRUE;

-- تحديث القيم الافتراضية للبيانات الموجودة
UPDATE settings 
SET 
  integrations_email_send_on_update = COALESCE(integrations_email_send_on_update, TRUE),
  integrations_email_send_on_move = COALESCE(integrations_email_send_on_move, TRUE),
  integrations_email_send_on_review_assigned = COALESCE(integrations_email_send_on_review_assigned, TRUE),
  integrations_email_send_on_review_updated = COALESCE(integrations_email_send_on_review_updated, TRUE)
WHERE integrations_email_send_on_update IS NULL;

-- إضافة تعليقات على الحقول للتوثيق
COMMENT ON COLUMN settings.integrations_email_send_on_update IS 'إرسال إشعار عند تحديث تذكرة (ticket_updated)';
COMMENT ON COLUMN settings.integrations_email_send_on_move IS 'إرسال إشعار عند تحريك تذكرة إلى مرحلة أخرى (ticket_moved)';
COMMENT ON COLUMN settings.integrations_email_send_on_review_assigned IS 'إرسال إشعار عند تعيين مراجع لتذكرة (ticket_review_assigned)';
COMMENT ON COLUMN settings.integrations_email_send_on_review_updated IS 'إرسال إشعار عند تحديث حالة المراجعة (ticket_review_updated)';

-- عرض رسالة نجاح
SELECT 
    'تم إضافة حقول إعدادات الإشعارات المتبقية بنجاح' as message,
    COUNT(*) as settings_count 
FROM settings;

