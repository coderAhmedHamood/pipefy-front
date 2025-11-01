-- Migration: إضافة حقول إعدادات البريد الإلكتروني والثيم
-- Created: 2025-01-31
-- Description: إضافة حقول جديدة لإعدادات البريد الإلكتروني والثيم في جدول settings

-- إضافة حقول إعدادات البريد الإلكتروني
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS integrations_email_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_delayed_tickets BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_assignment BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_comment BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_completion BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrations_email_send_on_creation BOOLEAN DEFAULT TRUE;

-- إضافة حقل الثيم
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS system_theme VARCHAR(50) DEFAULT 'light' CHECK (system_theme IN ('light', 'dark', 'auto'));

-- تحديث القيم الافتراضية للبيانات الموجودة
UPDATE settings 
SET 
  integrations_email_enabled = COALESCE(integrations_email_enabled, TRUE),
  integrations_email_send_delayed_tickets = COALESCE(integrations_email_send_delayed_tickets, TRUE),
  integrations_email_send_on_assignment = COALESCE(integrations_email_send_on_assignment, TRUE),
  integrations_email_send_on_comment = COALESCE(integrations_email_send_on_comment, TRUE),
  integrations_email_send_on_completion = COALESCE(integrations_email_send_on_completion, TRUE),
  integrations_email_send_on_creation = COALESCE(integrations_email_send_on_creation, TRUE),
  system_theme = COALESCE(system_theme, 'light')
WHERE integrations_email_enabled IS NULL;

-- عرض رسالة نجاح
SELECT 
    'تم إضافة حقول إعدادات البريد الإلكتروني والثيم بنجاح' as message,
    COUNT(*) as settings_count 
FROM settings;

