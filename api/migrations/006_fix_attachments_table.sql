-- Migration: إصلاح جدول المرفقات
-- Created: 2025-09-25

-- إضافة العمود المفقود description
ALTER TABLE ticket_attachments 
ADD COLUMN IF NOT EXISTS description TEXT;

-- إضافة العمود uploaded_by إذا لم يكن موجوداً
ALTER TABLE ticket_attachments 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id);

-- تحديث uploaded_by من user_id إذا كان فارغاً
UPDATE ticket_attachments 
SET uploaded_by = user_id 
WHERE uploaded_by IS NULL AND user_id IS NOT NULL;

-- إضافة فهرس للعمود الجديد
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON ticket_attachments(uploaded_by);

-- إضافة فهرس للبحث في الوصف
CREATE INDEX IF NOT EXISTS idx_attachments_description ON ticket_attachments(description);

-- إضافة فهرس للبحث في اسم الملف الأصلي
CREATE INDEX IF NOT EXISTS idx_attachments_original_filename ON ticket_attachments(original_filename);

-- إضافة فهرس لنوع الملف
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON ticket_attachments(mime_type);
