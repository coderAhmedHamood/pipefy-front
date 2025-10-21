-- Migration: إضافة حقل rate إلى جدول ticket_reviewers
-- الهدف: تمكين تقييم أداء المراجعين بأربع قيم محددة
-- التاريخ: 2025-10-21

-- إضافة حقل rate مع قيود القيم المسموحة
ALTER TABLE ticket_reviewers 
ADD COLUMN IF NOT EXISTS rate VARCHAR(20) 
CHECK (rate IN ('ضعيف', 'جيد', 'جيد جدا', 'ممتاز'));

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_rate 
ON ticket_reviewers(rate);

-- إضافة تعليق على الحقل للتوثيق
COMMENT ON COLUMN ticket_reviewers.rate IS 'تقييم أداء المراجع: ضعيف، جيد، جيد جدا، ممتاز';

-- إضافة تعليق على الفهرس
COMMENT ON INDEX idx_ticket_reviewers_rate IS 'فهرس للبحث السريع في تقييمات المراجعين';
