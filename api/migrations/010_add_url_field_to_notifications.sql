-- Migration: إضافة حقل url إلى جدول notifications
-- الهدف: إضافة حقل url منفصل لتخزين روابط إضافية
-- التاريخ: 2025-10-21

-- إضافة حقل url
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS url TEXT;

-- إضافة فهرس للبحث السريع (اختياري)
CREATE INDEX IF NOT EXISTS idx_notifications_url 
ON notifications(url) WHERE url IS NOT NULL;

-- إضافة تعليق على الحقل للتوثيق
COMMENT ON COLUMN notifications.url IS 'رابط إضافي للإشعار - يمكن استخدامه للتوجيه أو المراجع';
