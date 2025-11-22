-- Migration: إنشاء جدول ticket_evaluation_summary
-- الهدف: إنشاء جدول ملخص التقييمات للتذاكر
-- التاريخ: 2025-11-23

-- إنشاء جدول ticket_evaluation_summary
CREATE TABLE IF NOT EXISTS ticket_evaluation_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
  total_reviewers INTEGER DEFAULT 0,
  completed_reviews INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  overall_rating VARCHAR(50), -- Excellent, Good, Fair, Poor
  evaluation_data JSONB, -- تخزين ملخص مفصل للتقييمات
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_ticket ON ticket_evaluation_summary(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_rating ON ticket_evaluation_summary(overall_rating);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_completed ON ticket_evaluation_summary(completed_at);

-- عرض رسالة نجاح
SELECT 
  'تم إنشاء جدول ticket_evaluation_summary بنجاح' as message,
  COUNT(*) as total_summaries
FROM ticket_evaluation_summary;

